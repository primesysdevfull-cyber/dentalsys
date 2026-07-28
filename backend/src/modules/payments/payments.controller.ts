import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaymentsService } from './payments.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import Stripe from 'stripe';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'FINANCIAL', 'RECEPTIONIST')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar sessão de checkout Stripe' })
  async createCheckout(@Body() dto: CreateCheckoutDto, @TenantId() tenantId: string) {
    const session = await this.paymentsService.createCheckoutSession(dto, tenantId);
    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  @Post('intent')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'FINANCIAL', 'RECEPTIONIST')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar PaymentIntent Stripe' })
  async createPaymentIntent(
    @Body()
    body: {
      amount: number;
      currency?: string;
      patientId?: string;
      description?: string;
      transactionId?: string;
    },
    @TenantId() tenantId: string,
  ) {
    const paymentIntent = await this.paymentsService.createPaymentIntent(
      body.amount,
      body.currency || 'brl',
      tenantId,
      body.patientId,
      body.description,
      body.transactionId,
    );
    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook Stripe - receber eventos' })
  async handleWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = (req as any).rawBody as Buffer;

    if (!rawBody) {
      throw new BadRequestException('Raw body não disponível');
    }

    if (!signature) {
      throw new BadRequestException('Assinatura Stripe ausente');
    }

    try {
      const result = await this.paymentsService.handleWebhook(rawBody, signature);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('subscription')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar assinatura Stripe (billing SaaS)' })
  async createSubscription(@Body() dto: CreateSubscriptionDto, @TenantId() tenantId: string) {
    const subscription = await this.paymentsService.createSubscription(dto, tenantId);
    const latestInvoice = subscription.latest_invoice as Stripe.Invoice | null;
    const paymentIntent = latestInvoice?.payment_intent as Stripe.PaymentIntent | null;
    return {
      subscriptionId: subscription.id,
      status: subscription.status,
      clientSecret: paymentIntent?.client_secret || null,
    };
  }

  @Get('status/:sessionId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'FINANCIAL', 'RECEPTIONIST')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consultar status de uma sessão de pagamento' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão Stripe Checkout' })
  async getPaymentStatus(@Param('sessionId') sessionId: string) {
    return this.paymentsService.getPaymentStatus(sessionId);
  }

  @Post('refund/:paymentIntentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'FINANCIAL')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar reembolso para um pagamento' })
  @ApiParam({ name: 'paymentIntentId', description: 'ID do PaymentIntent Stripe' })
  async createRefund(
    @Param('paymentIntentId') paymentIntentId: string,
    @Body() body: { amount?: number; reason?: string },
  ) {
    const refund = await this.paymentsService.createRefund(
      paymentIntentId,
      body.amount,
      body.reason,
    );
    return {
      refundId: refund.id,
      status: refund.status,
      amount: refund.amount,
    };
  }

  @Get('customers/:customerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'FINANCIAL')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar pagamentos de um cliente Stripe' })
  @ApiParam({ name: 'customerId', description: 'ID do cliente Stripe' })
  async getCustomerPayments(@Param('customerId') customerId: string) {
    return this.paymentsService.getCustomerPayments(customerId);
  }
}
