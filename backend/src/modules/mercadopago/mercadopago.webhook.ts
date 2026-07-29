import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionStatus } from '@prisma/client';

@Injectable()
export class MercadoPagoWebhookHandler {
  private readonly logger = new Logger(MercadoPagoWebhookHandler.name);
  private readonly pendingPayments = new Map<string, { resolve: (status: string) => void; reject: (err: Error) => void }>();

  constructor(private readonly prisma: PrismaService) {}

  waitForPayment(externalId: string, timeoutMs = 60000): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingPayments.delete(externalId);
        reject(new Error('Timeout aguardando confirmação de pagamento'));
      }, timeoutMs);
      this.pendingPayments.set(externalId, {
        resolve: (status) => {
          clearTimeout(timeout);
          resolve(status);
        },
        reject: (err) => {
          clearTimeout(timeout);
          reject(err);
        },
      });
    });
  }

  async handleEvent(topic: string, resource: any): Promise<void> {
    this.logger.log(`Processing webhook: topic=${topic} resource=${JSON.stringify(resource).substring(0, 200)}`);

    if (topic === 'payment') {
      const paymentId = resource.id || resource;
      await this.handlePaymentUpdate(paymentId.toString());
    } else if (topic === 'merchant_order') {
      this.logger.log(`Merchant order update: ${JSON.stringify(resource)}`);
    }
  }

  async handlePaymentUpdate(paymentId: string): Promise<void> {
    try {
      const { MercadoPagoConfig, Payment } = require('mercadopago');
      const mpAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
      if (!mpAccessToken) {
        this.logger.error('MERCADO_PAGO_ACCESS_TOKEN not configured');
        return;
      }
      const client = new MercadoPagoConfig({ accessToken: mpAccessToken });
      const paymentApi = new Payment(client);
      const payment = await paymentApi.get({ id: paymentId });

      this.logger.log(`Payment ${paymentId} status: ${payment.status}`);

      const externalReference = payment.external_reference as string;
      if (!externalReference) {
        this.logger.warn(`No external_reference for payment ${paymentId}`);
        return;
      }

      let newStatus: TransactionStatus;
      switch (payment.status) {
        case 'approved':
          newStatus = TransactionStatus.PAID;
          break;
        case 'rejected':
        case 'cancelled':
          newStatus = TransactionStatus.CANCELLED;
          break;
        case 'refunded':
          newStatus = TransactionStatus.REFUNDED;
          break;
        case 'partially_refunded':
          newStatus = TransactionStatus.PARTIAL;
          break;
        default:
          newStatus = TransactionStatus.PENDING;
      }

      const transaction = await this.prisma.financialTransaction.findFirst({
        where: { id: externalReference },
      });

      if (transaction) {
        const updateData: any = { status: newStatus };
        if (newStatus === TransactionStatus.PAID) {
          updateData.paidAt = new Date();
          const paymentMethod = payment.payment_method_id === 'pix' ? 'PIX'
            : payment.payment_method_id === 'bolbradesco' ? 'BOLETO'
            : payment.payment_method_id === 'master' ? 'CREDIT_CARD'
            : 'OTHER';
          updateData.paymentMethod = paymentMethod;
          updateData.notes = `Mercado Pago: ${paymentId} | ${payment.status_detail || ''}`;
        }
        await this.prisma.financialTransaction.update({
          where: { id: externalReference },
          data: updateData,
        });
        this.logger.log(`Transaction ${externalReference} updated to ${newStatus}`);
      }

      const pending = this.pendingPayments.get(externalReference);
      if (pending) {
        pending.resolve(newStatus);
        this.pendingPayments.delete(externalReference);
      }
    } catch (error) {
      this.logger.error(`Failed to process payment update ${paymentId}: ${error.message}`);
    }
  }
}
