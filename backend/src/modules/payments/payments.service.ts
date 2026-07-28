import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import Stripe from 'stripe';
import { TransactionStatus } from '@prisma/client';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { CreateSubscriptionDto, SubscriptionInterval } from './dto/create-subscription.dto';
import { PaymentsWebhookHandler } from './payments.webhook';

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe | null = null;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly webhookHandler: PaymentsWebhookHandler,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY', '');
    if (secretKey && secretKey.startsWith('sk_')) {
      this.stripe = new Stripe(secretKey, {
        apiVersion: '2024-06-20' as any,
      });
    } else {
      this.logger.warn('STRIPE_SECRET_KEY not configured. Payment features disabled.');
    }
  }

  private getStripe(): Stripe {
    if (!this.stripe) {
      throw new InternalServerErrorException('Stripe não está configurado. Configure STRIPE_SECRET_KEY.');
    }
    return this.stripe;
  }

  async createCheckoutSession(dto: CreateCheckoutDto, tenantId: string): Promise<Stripe.Checkout.Session> {
    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
      select: { id: true, name: true, email: true, tenantId: true },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado');
    }

    if (patient.tenantId !== tenantId) {
      throw new BadRequestException('Paciente não pertence a este tenant');
    }

    let stripeCustomerId = await this.getStripeCustomerId(dto.patientId);

    if (!stripeCustomerId) {
      const customer = await this.createCustomer({
        name: patient.name,
        email: dto.customerEmail || patient.email || undefined,
        metadata: { patientId: dto.patientId, tenantId },
      });
      stripeCustomerId = customer.id;
    }

    let transactionId = dto.transactionId;
    if (!transactionId) {
      const transaction = await this.prisma.financialTransaction.create({
        data: {
          tenantId,
          type: 'INCOME',
          patientId: dto.patientId,
          description: dto.description || 'Pagamento via Stripe Checkout',
          amount: dto.amount || 0,
          totalAmount: dto.amount || 0,
          status: 'PENDING',
        },
      });
      transactionId = transaction.id;
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    if (dto.items && dto.items.length > 0) {
      for (const item of dto.items) {
        lineItems.push({
          price_data: {
            currency: dto.currency || 'brl',
            product_data: {
              name: item.name,
              description: item.description,
            },
            unit_amount: item.amount,
          },
          quantity: item.quantity || 1,
        });
      }
    } else if (dto.amount) {
      lineItems.push({
        price_data: {
          currency: dto.currency || 'brl',
          product_data: {
            name: dto.description || 'Pagamento',
          },
          unit_amount: dto.amount,
        },
        quantity: 1,
      });
    }

    if (lineItems.length === 0) {
      throw new BadRequestException('Informe o amount ou items para o checkout');
    }

    try {
      const session = await this.getStripe().checkout.sessions.create({
        customer: stripeCustomerId,
        mode: 'payment',
        line_items: lineItems,
        success_url: dto.successUrl,
        cancel_url: dto.cancelUrl,
        customer_email: stripeCustomerId ? undefined : dto.customerEmail,
        metadata: {
          patientId: dto.patientId,
          tenantId,
          transactionId,
        },
      });

      this.logger.log(`Checkout session created: ${session.id} for patient ${dto.patientId}`);
      return session;
    } catch (error) {
      this.logger.error(`Failed to create checkout session: ${error.message}`);
      throw new InternalServerErrorException('Erro ao criar sessão de checkout');
    }
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
    tenantId: string,
    patientId?: string,
    description?: string,
    transactionId?: string,
  ): Promise<Stripe.PaymentIntent> {
    if (amount < 100) {
      throw new BadRequestException('Valor mínimo é R$ 1,00 (100 centavos)');
    }

    let resolvedTransactionId = transactionId;
    if (!resolvedTransactionId && patientId) {
      const transaction = await this.prisma.financialTransaction.create({
        data: {
          tenantId,
          type: 'INCOME',
          patientId,
          description: description || 'Pagamento via Stripe',
          amount,
          totalAmount: amount,
          status: 'PENDING',
        },
      });
      resolvedTransactionId = transaction.id;
    }

    const metadata: Record<string, string> = { tenantId };
    if (patientId) metadata.patientId = patientId;
    if (resolvedTransactionId) metadata.transactionId = resolvedTransactionId;

    let stripeCustomerId: string | undefined;
    if (patientId) {
      const existing = await this.getStripeCustomerId(patientId);
      if (existing) stripeCustomerId = existing;
    }

    try {
      const paymentIntent = await this.getStripe().paymentIntents.create({
        amount,
        currency: currency || 'brl',
        description,
        customer: stripeCustomerId,
        metadata,
      });

      this.logger.log(`PaymentIntent created: ${paymentIntent.id} for amount ${amount}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`Failed to create PaymentIntent: ${error.message}`);
      throw new InternalServerErrorException('Erro ao criar PaymentIntent');
    }
  }

  async createCustomer(params: {
    name?: string;
    email?: string;
    phone?: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Customer> {
    try {
      const customer = await this.getStripe().customers.create({
        name: params.name,
        email: params.email,
        phone: params.phone,
        metadata: params.metadata,
      });

      this.logger.log(`Stripe customer created: ${customer.id}`);

      if (params.metadata?.patientId) {
        try {
          await this.prisma.$executeRaw`
            UPDATE patients
            SET stripe_customer_id = ${customer.id}
            WHERE id = ${params.metadata.patientId}
          `;
        } catch (error) {
          this.logger.warn(`Could not store stripeCustomerId on patient: ${error.message}`);
        }
      }

      return customer;
    } catch (error) {
      this.logger.error(`Failed to create Stripe customer: ${error.message}`);
      throw new InternalServerErrorException('Erro ao criar cliente Stripe');
    }
  }

  async createSubscription(dto: CreateSubscriptionDto, tenantId: string): Promise<Stripe.Subscription> {
    let stripeCustomerId: string | null = null;

    try {
      const existingCustomers = await this.getStripe().customers.list({
        email: dto.customerEmail,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        stripeCustomerId = existingCustomers.data[0].id;
      } else {
        const customer = await this.createCustomer({
          name: dto.customerName,
          email: dto.customerEmail,
          metadata: { tenantId: dto.tenantId },
        });
        stripeCustomerId = customer.id;
      }

      const subscriptionParams: Stripe.SubscriptionCreateParams = {
        customer: stripeCustomerId,
        items: [{ price: dto.priceId }],
        metadata: {
          tenantId: dto.tenantId,
          tenantSlug: dto.metadata?.clinicSlug || '',
          planName: dto.metadata?.planName || '',
        },
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      };

      if (dto.trialPeriod && dto.trialPeriodDays) {
        subscriptionParams.trial_period_days = dto.trialPeriodDays;
      } else if (dto.trialPeriod) {
        subscriptionParams.trial_period_days = 14;
      }

      if (dto.successUrl && dto.cancelUrl) {
        subscriptionParams.payment_settings = {
          save_default_payment_method: 'on_subscription',
        };
      }

      const subscription = await this.getStripe().subscriptions.create(subscriptionParams);

      await this.prisma.$executeRaw`
        UPDATE tenants
        SET subscription = jsonb_set(
          COALESCE(subscription, '{}'),
          '{stripeSubscriptionId}',
          ${JSON.stringify(subscription.id)}::jsonb
        )
        WHERE id = ${dto.tenantId}
      `;

      this.logger.log(`Subscription created: ${subscription.id} for tenant ${dto.tenantId}`);
      return subscription;
    } catch (error) {
      this.logger.error(`Failed to create subscription: ${error.message}`);
      throw new InternalServerErrorException('Erro ao criar assinatura');
    }
  }

  async handleWebhook(rawBody: Buffer, signature: string): Promise<{ received: boolean }> {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new InternalServerErrorException('STRIPE_WEBHOOK_SECRET não configurado');
    }

    let event: Stripe.Event;
    try {
      event = this.getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (error) {
      this.logger.error(`Webhook signature verification failed: ${error.message}`);
      throw new BadRequestException('Assinatura do webhook inválida');
    }

    await this.webhookHandler.handleEvent(event);
    return { received: true };
  }

  async getPaymentStatus(sessionId: string): Promise<{
    status: string;
    paymentStatus: string | null;
    amountTotal: number | null;
    currency: string | null;
    customerEmail: string | null;
    metadata: Record<string, string> | null;
  }> {
    try {
      const session = await this.getStripe().checkout.sessions.retrieve(sessionId);
      return {
        status: session.status || 'unknown',
        paymentStatus: session.payment_status,
        amountTotal: session.amount_total,
        currency: session.currency,
        customerEmail: session.customer_details?.email || null,
        metadata: session.metadata as Record<string, string> | null,
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve session ${sessionId}: ${error.message}`);
      throw new NotFoundException('Sessão de pagamento não encontrada');
    }
  }

  async createRefund(
    paymentIntentId: string,
    amount?: number,
    reason?: string,
  ): Promise<Stripe.Refund> {
    try {
      const paymentIntent = await this.getStripe().paymentIntents.retrieve(paymentIntentId);
      if (!paymentIntent) {
        throw new NotFoundException('PaymentIntent não encontrado');
      }

      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
      };

      if (amount) {
        refundParams.amount = amount;
      }

      if (reason) {
        refundParams.reason = reason as Stripe.RefundCreateParams.Reason;
      }

      const refund = await this.getStripe().refunds.create(refundParams);

      const transactionId = paymentIntent.metadata?.transactionId;
      if (transactionId) {
        await this.prisma.financialTransaction.update({
          where: { id: transactionId },
          data: {
            status: TransactionStatus.REFUNDED,
            notes: `Stripe Refund: ${refund.id} | Motivo: ${reason || 'Não especificado'}`,
          },
        });
      }

      this.logger.log(`Refund created: ${refund.id} for PaymentIntent ${paymentIntentId}`);
      return refund;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to create refund: ${error.message}`);
      throw new InternalServerErrorException('Erro ao processar reembolso');
    }
  }

  async listTransactions(
    tenantId: string,
    options?: {
      page?: number;
      limit?: number;
      startingAfter?: string;
      endingBefore?: string;
    },
  ): Promise<{
    data: Stripe.PaymentIntent[];
    hasMore: boolean;
    totalCount: number;
  }> {
    try {
      const params: Stripe.PaymentIntentListParams = {
        limit: options?.limit || 25,
      };

      if (options?.startingAfter) {
        params.starting_after = options.startingAfter;
      }
      if (options?.endingBefore) {
        params.ending_before = options.endingBefore;
      }

      const paymentIntents = await this.getStripe().paymentIntents.list(params);

      let totalCount = 0;
      try {
        const countResult = await this.prisma.$queryRaw<{ count: bigint }[]>`
          SELECT COUNT(*) as count FROM financial_transactions
          WHERE tenant_id = ${tenantId}
        `;
        totalCount = Number(countResult[0]?.count || 0);
      } catch {
        totalCount = paymentIntents.data.length;
      }

      return {
        data: paymentIntents.data,
        hasMore: paymentIntents.has_more,
        totalCount,
      };
    } catch (error) {
      this.logger.error(`Failed to list transactions: ${error.message}`);
      throw new InternalServerErrorException('Erro ao listar transações');
    }
  }

  async getCustomerPayments(customerId: string): Promise<{
    customer: Stripe.Customer | Stripe.DeletedCustomer;
    charges: Stripe.Charge[];
    subscriptions: Stripe.Subscription[];
  }> {
    try {
      const customer = await this.getStripe().customers.retrieve(customerId);

      const charges = await this.getStripe().charges.list({
        customer: customerId,
        limit: 100,
      });

      const subscriptions = await this.getStripe().subscriptions.list({
        customer: customerId,
        limit: 100,
      });

      return {
        customer,
        charges: charges.data,
        subscriptions: subscriptions.data,
      };
    } catch (error) {
      this.logger.error(`Failed to get customer payments: ${error.message}`);
      throw new NotFoundException('Cliente Stripe não encontrado');
    }
  }

  private async getStripeCustomerId(patientId: string): Promise<string | null> {
    try {
      const result = await this.prisma.$queryRaw<{ stripe_customer_id: string | null }[]>`
        SELECT stripe_customer_id FROM patients WHERE id = ${patientId} LIMIT 1
      `;
      return result[0]?.stripe_customer_id || null;
    } catch {
      return null;
    }
  }
}
