import {
  Controller, Post, Get, Body, Param, UseGuards, HttpCode, HttpStatus, Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { MercadoPagoService } from './mercadopago.service';
import { CreateMpPreferenceDto } from './dto/create-mp-preference.dto';
import { CreateMpPaymentDto } from './dto/create-mp-payment.dto';

@ApiTags('Mercado Pago')
@Controller('mercadopago')
export class MercadoPagoController {
  constructor(private readonly mercadopagoService: MercadoPagoService) {}

  @Post('preference')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'FINANCIAL', 'RECEPTIONIST')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar preferência Checkout Pro Mercado Pago' })
  async createPreference(@Body() dto: CreateMpPreferenceDto, @TenantId() tenantId: string) {
    return this.mercadopagoService.createPreference(dto, tenantId);
  }

  @Post('payment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'FINANCIAL', 'RECEPTIONIST')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar pagamento direto (PIX/Boleto/Cartão)' })
  async createPayment(@Body() dto: CreateMpPaymentDto, @TenantId() tenantId: string) {
    return this.mercadopagoService.createPayment(dto, tenantId);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook Mercado Pago' })
  @ApiQuery({ name: 'topic', required: false })
  @ApiQuery({ name: 'id', required: false })
  async handleWebhook(
    @Query() query: any,
    @Body() body?: any,
  ) {
    return this.mercadopagoService.handleWebhook(query, body);
  }

  @Get('payment/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'FINANCIAL', 'RECEPTIONIST')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consultar status de pagamento' })
  @ApiParam({ name: 'id', description: 'ID do pagamento no Mercado Pago' })
  async getPaymentStatus(@Param('id') id: string) {
    return this.mercadopagoService.getPaymentStatus(id);
  }

  @Post('refund/:paymentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'FINANCIAL')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reembolsar pagamento' })
  @ApiParam({ name: 'paymentId', description: 'ID do pagamento no Mercado Pago' })
  async createRefund(
    @Param('paymentId') paymentId: string,
    @Body() body: { amount?: number },
  ) {
    return this.mercadopagoService.createRefund(paymentId, body.amount);
  }
}
