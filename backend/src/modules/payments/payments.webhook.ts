import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import Stripe from 'stripe';
import { TransactionStatus } from '@prisma/client';

@Injectable()
export class PaymentsWebhookHandler {
  private readonly logger = new Logger(PaymentsWebhookHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async handleEvent(event: Stripe.Event): Promise<void> {
    this.logger.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        this.logger.warn(`Unhandled webhook event type: ${event.type}`);
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    this.logger.log(`Checkout session completed: ${session.id}`);

    const transactionId = session.metadata?.transactionId;
    if (!transactionId) {
      this.logger.warn(`No transactionId in session metadata for session ${session.id}`);
      return;
    }

    try {
      await this.prisma.financialTransaction.update({
        where: { id: transactionId },
        data: {
          status: TransactionStatus.PAID,
          paidAt: new Date(),
          notes: `Stripe Checkout Session: ${session.id} | Payment Intent: ${session.payment_intent}`,
        },
      });
      this.logger.log(`Transaction ${transactionId} marked as PAID`);
    } catch (error) {
      this.logger.error(`Failed to update transaction ${transactionId}: ${error.message}`);
    }

    const patientId = session.metadata?.patientId;
    const tenantId = session.metadata?.tenantId;
    if (patientId && tenantId) {
      await this.ensureStripeCustomerExists(patientId, session.customer as string, tenantId);
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    this.logger.log(`Payment intent succeeded: ${paymentIntent.id}`);

    const transactionId = paymentIntent.metadata?.transactionId;
    if (!transactionId) {
      this.logger.warn(`No transactionId in payment intent metadata for ${paymentIntent.id}`);
      return;
    }

    try {
      await this.prisma.financialTransaction.update({
        where: { id: transactionId },
        data: {
          status: TransactionStatus.PAID,
          paidAt: new Date(),
          notes: `Stripe Payment Intent: ${paymentIntent.id}`,
        },
      });
      this.logger.log(`Transaction ${transactionId} marked as PAID via PaymentIntent`);
    } catch (error) {
      this.logger.error(`Failed to update transaction ${transactionId}: ${error.message}`);
    }
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    this.logger.log(`Invoice paid: ${invoice.id}`);

    const subscriptionId = invoice.subscription as string;
    if (!subscriptionId) return;

    try {
      await this.prisma.$executeRaw`
        UPDATE tenants
        SET subscription = jsonb_set(
          COALESCE(subscription, '{}'),
          '{status}',
          '"active"'
        )
        WHERE id = (
          SELECT tenant_id FROM patients
          WHERE id = (
            SELECT patient_id FROM financial_transactions
            WHERE notes LIKE ${`%${subscriptionId}%`}
            LIMIT 1
          )
        )
      `;
      this.logger.log(`Tenant subscription updated to active for invoice ${invoice.id}`);
    } catch (error) {
      this.logger.error(`Failed to update subscription for invoice ${invoice.id}: ${error.message}`);
    }
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    this.logger.warn(`Invoice payment failed: ${invoice.id}`);

    const subscriptionId = invoice.subscription as string;
    if (!subscriptionId) return;

    try {
      await this.prisma.$executeRaw`
        UPDATE tenants
        SET subscription = jsonb_set(
          COALESCE(subscription, '{}'),
          '{status}',
          '"past_due"'
        )
        WHERE id = (
          SELECT tenant_id FROM patients
          WHERE id = (
            SELECT patient_id FROM financial_transactions
            WHERE notes LIKE ${`%${subscriptionId}%`}
            LIMIT 1
          )
        )
      `;
      this.logger.log(`Tenant subscription marked as past_due for invoice ${invoice.id}`);
    } catch (error) {
      this.logger.error(`Failed to update subscription status for invoice ${invoice.id}: ${error.message}`);
    }
  }

  private async ensureStripeCustomerExists(
    patientId: string,
    stripeCustomerId: string | null | undefined,
    tenantId: string,
  ): Promise<void> {
    if (!stripeCustomerId) return;

    try {
      const existing = await this.prisma.$queryRaw<{ stripe_customer_id: string }[]>`
        SELECT stripe_customer_id FROM patients WHERE id = ${patientId} LIMIT 1
      `;

      if (!existing.length || !existing[0].stripe_customer_id) {
        await this.prisma.$executeRaw`
          UPDATE patients SET stripe_customer_id = ${stripeCustomerId} WHERE id = ${patientId}
        `;
        this.logger.log(`Stored Stripe customer ${stripeCustomerId} for patient ${patientId}`);
      }
    } catch (error) {
      this.logger.warn(`Could not store stripeCustomerId for patient ${patientId}: ${error.message}`);
    }
  }
}
