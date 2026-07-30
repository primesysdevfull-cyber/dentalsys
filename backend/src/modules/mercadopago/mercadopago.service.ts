import { Injectable, Logger, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionStatus } from '@prisma/client';
import { CreateMpPreferenceDto } from './dto/create-mp-preference.dto';
import { CreateMpPaymentDto, MpPaymentMethod } from './dto/create-mp-payment.dto';
import { MercadoPagoWebhookHandler } from './mercadopago.webhook';

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private readonly clientCache = new Map<string, any>();

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly webhookHandler: MercadoPagoWebhookHandler,
  ) {}

  private async getClient(tenantId: string): Promise<any> {
    const cached = this.clientCache.get(tenantId);
    if (cached) return cached;

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { mercadopagoAccessToken: true },
    });

    if (!tenant?.mercadopagoAccessToken) {
      throw new InternalServerErrorException('Token do Mercado Pago não configurado. Acesse Configurações > Mercado Pago para configurar.');
    }

    const { MercadoPagoConfig } = require('mercadopago');
    const client = new MercadoPagoConfig({ accessToken: tenant.mercadopagoAccessToken });
    this.clientCache.set(tenantId, client);
    return client;
  }

  clearCache(tenantId: string) {
    this.clientCache.delete(tenantId);
  }

  async createPreference(dto: CreateMpPreferenceDto, tenantId: string): Promise<any> {
    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
      select: { id: true, name: true, email: true, tenantId: true },
    });

    if (!patient) throw new NotFoundException('Paciente não encontrado');
    if (patient.tenantId !== tenantId) throw new BadRequestException('Paciente não pertence a este tenant');

    const transaction = await this.prisma.financialTransaction.create({
      data: {
        tenantId,
        type: 'INCOME',
        patientId: dto.patientId,
        description: dto.description,
        amount: dto.amount / 100,
        totalAmount: dto.amount / 100,
        status: 'PENDING',
      },
    });

    try {
      const client = await this.getClient(tenantId);
      const { Preference } = require('mercadopago');
      const preferenceApi = new Preference(client);
      const preference = await preferenceApi.create({
        body: {
          items: [{
            id: transaction.id,
            title: dto.description,
            quantity: 1,
            unit_price: dto.amount / 100,
            currency_id: 'BRL',
          }],
          payer: {
            email: dto.email || patient.email || undefined,
            ...(dto.cpf ? { identification: { type: 'CPF', number: dto.cpf } } : {}),
          },
          external_reference: transaction.id,
          back_urls: {
            success: `${process.env.APP_FRONTEND_URL || 'http://localhost:5173'}/payments/success`,
            failure: `${process.env.APP_FRONTEND_URL || 'http://localhost:5173'}/payments/failure`,
            pending: `${process.env.APP_FRONTEND_URL || 'http://localhost:5173'}/payments/pending`,
          },
          auto_return: 'approved',
          notification_url: `${process.env.APP_URL || 'http://localhost:3000'}/api/v1/mercadopago/webhook`,
          payment_methods: {
            installments: 12,
          },
        },
      });

      return {
        preferenceId: preference.id,
        initPoint: preference.init_point,
        sandboxInitPoint: preference.sandbox_init_point,
        transactionId: transaction.id,
      };
    } catch (error) {
      this.logger.error(`Failed to create preference: ${error.message}`);
      throw new InternalServerErrorException('Erro ao criar preferência de pagamento');
    }
  }

  async createPayment(dto: CreateMpPaymentDto, tenantId: string): Promise<any> {
    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
      select: { id: true, name: true, email: true, cpf: true, tenantId: true },
    });

    if (!patient) throw new NotFoundException('Paciente não encontrado');
    if (patient.tenantId !== tenantId) throw new BadRequestException('Paciente não pertence a este tenant');

    let transactionId = dto.transactionId;
    if (!transactionId) {
      const transaction = await this.prisma.financialTransaction.create({
        data: {
          tenantId,
          type: 'INCOME',
          patientId: dto.patientId,
          description: dto.description,
          amount: dto.amount,
          totalAmount: dto.amount,
          status: 'PENDING',
        },
      });
      transactionId = transaction.id;
    }

    const cpf = dto.cpf || patient.cpf;
    if (!cpf && dto.paymentMethod !== MpPaymentMethod.CREDIT_CARD) {
      throw new BadRequestException('CPF é obrigatório para PIX e Boleto');
    }

    try {
      const client = await this.getClient(tenantId);
      const { Payment } = require('mercadopago');
      const paymentApi = new Payment(client);

      const paymentData: any = {
        body: {
          transaction_amount: dto.amount,
          description: dto.description,
          payment_method_id: dto.paymentMethod === MpPaymentMethod.PIX ? 'pix'
            : dto.paymentMethod === MpPaymentMethod.BOLETO ? 'bolbradesco'
            : undefined,
          payer: {
            email: dto.email || patient.email || 'comprador@email.com',
            ...(cpf ? { identification: { type: 'CPF', number: cpf } } : {}),
          },
          external_reference: transactionId,
        },
      };

      if (dto.paymentMethod === MpPaymentMethod.CREDIT_CARD) {
        if (!dto.cardToken) throw new BadRequestException('Card token é obrigatório para cartão de crédito');
        paymentData.body.token = dto.cardToken;
        paymentData.body.installments = dto.installments || 1;
        paymentData.body.payment_method_id = 'master';
      }

      if (dto.paymentMethod === MpPaymentMethod.PIX) {
        paymentData.body.date_of_expiration = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      }

      const payment = await paymentApi.create(paymentData);

      await this.prisma.financialTransaction.update({
        where: { id: transactionId },
        data: { notes: `Mercado Pago ID: ${payment.id}` },
      });

      const result: any = {
        id: payment.id,
        status: payment.status,
        statusDetail: payment.status_detail,
        transactionId,
      };

      if (dto.paymentMethod === MpPaymentMethod.PIX) {
        const pixData = payment.point_of_interaction?.transaction_data;
        result.qrCode = pixData?.qr_code || null;
        result.qrCodeBase64 = pixData?.qr_code_base64 || null;
        result.qrCodeImage = pixData?.qr_code_base64 ? `data:image/png;base64,${pixData.qr_code_base64}` : null;
        result.ticketUrl = pixData?.ticket_url || null;
      }

      if (dto.paymentMethod === MpPaymentMethod.BOLETO) {
        result.boletoUrl = payment.transaction_details?.external_resource_url || null;
        result.boletoBarcode = payment.barcode?.content || null;
      }

      if (dto.paymentMethod === MpPaymentMethod.CREDIT_CARD && payment.status === 'approved') {
        await this.prisma.financialTransaction.update({
          where: { id: transactionId },
          data: { status: TransactionStatus.PAID, paidAt: new Date(), paymentMethod: 'CREDIT_CARD' },
        });
        result.transactionStatus = 'PAID';
      }

      return result;
    } catch (error) {
      this.logger.error(`Failed to create payment: ${error.message}`);
      if (error.cause) this.logger.error(`Mercado Pago cause: ${JSON.stringify(error.cause)}`);
      throw new InternalServerErrorException(`Erro ao criar pagamento: ${error.message}`);
    }
  }

  async getPaymentStatus(tenantId: string, paymentId: string): Promise<any> {
    try {
      const client = await this.getClient(tenantId);
      const { Payment } = require('mercadopago');
      const paymentApi = new Payment(client);
      const payment = await paymentApi.get({ id: paymentId });

      return {
        id: payment.id,
        status: payment.status,
        statusDetail: payment.status_detail,
        description: payment.description,
        transactionAmount: payment.transaction_amount,
        paymentMethod: payment.payment_method_id,
        payer: payment.payer,
        externalReference: payment.external_reference,
        dateCreated: payment.date_created,
        dateApproved: payment.date_approved,
      };
    } catch (error) {
      this.logger.error(`Failed to get payment status: ${error.message}`);
      throw new NotFoundException('Pagamento não encontrado');
    }
  }

  async createRefund(tenantId: string, paymentId: string, amount?: number): Promise<any> {
    try {
      const client = await this.getClient(tenantId);
      const { Payment, Refund } = require('mercadopago');
      const refundApi = new Refund(client);
      const refundData: any = { payment_id: paymentId };
      if (amount) refundData.amount = amount;
      const refund = await refundApi.create(refundData);

      const transaction = await this.prisma.financialTransaction.findFirst({
        where: { notes: { contains: paymentId } },
      });

      if (transaction) {
        await this.prisma.financialTransaction.update({
          where: { id: transaction.id },
          data: { status: amount ? TransactionStatus.PARTIAL : TransactionStatus.REFUNDED },
        });
      }

      return { id: refund.id, status: refund.status, amount: refund.amount, paymentId };
    } catch (error) {
      this.logger.error(`Failed to create refund: ${error.message}`);
      throw new InternalServerErrorException('Erro ao processar reembolso');
    }
  }

  async handleWebhook(query: any, body?: any): Promise<{ received: boolean }> {
    this.logger.log(`Webhook received: ${JSON.stringify(query)}`);

    if (query.topic === 'payment' || query.type === 'payment') {
      const paymentId = query.id || query.data?.id;
      if (paymentId) {
        await this.webhookHandler.handlePaymentUpdate(paymentId.toString());
      }
    } else if (query.topic) {
      await this.webhookHandler.handleEvent(query.topic, query);
    }

    if (body?.action === 'payment.created' || body?.action === 'payment.updated') {
      const paymentId = body?.data?.id;
      if (paymentId) {
        await this.webhookHandler.handlePaymentUpdate(paymentId.toString());
      }
    }

    return { received: true };
  }
}
