import {
  Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('billing')
export class BillingController {
  constructor(private billingService: BillingService) {}

  @Get()
  @Roles('ADMIN', 'FINANCIAL', 'RECEPTIONIST')
  @ApiOperation({ summary: 'Listar transações financeiras' })
  findAll(
    @TenantId() tenantId: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('patientId') patientId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
  ) {
    return this.billingService.findAll(tenantId, {
      type, status, patientId, startDate, endDate, page,
    });
  }

  @Get('dre')
  @Roles('ADMIN', 'FINANCIAL')
  @ApiOperation({ summary: 'Demonstração do Resultado do Exercício (DRE)' })
  getDRE(
    @TenantId() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.billingService.getDRE(tenantId, startDate, endDate);
  }

  @Get('cash-flow')
  @Roles('ADMIN', 'FINANCIAL')
  @ApiOperation({ summary: 'Fluxo de caixa mensal' })
  getCashFlow(
    @TenantId() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.billingService.getCashFlow(tenantId, startDate, endDate);
  }

  @Get('dashboard')
  @Roles('ADMIN', 'FINANCIAL')
  @ApiOperation({ summary: 'Dashboard financeiro' })
  getDashboard(
    @TenantId() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.billingService.getDashboard(tenantId, startDate, endDate);
  }

  @Get('accounts-receivable')
  @Roles('ADMIN', 'FINANCIAL')
  @ApiOperation({ summary: 'Contas a receber' })
  getAccountsReceivable(@TenantId() tenantId: string) {
    return this.billingService.getAccountsReceivable(tenantId);
  }

  @Get('accounts-payable')
  @Roles('ADMIN', 'FINANCIAL')
  @ApiOperation({ summary: 'Contas a pagar' })
  getAccountsPayable(@TenantId() tenantId: string) {
    return this.billingService.getAccountsPayable(tenantId);
  }

  @Get(':id')
  @Roles('ADMIN', 'FINANCIAL', 'RECEPTIONIST')
  @ApiOperation({ summary: 'Obter transação por ID' })
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.billingService.findOne(tenantId, id);
  }

  @Post()
  @Roles('ADMIN', 'FINANCIAL', 'RECEPTIONIST')
  @ApiOperation({ summary: 'Criar transação financeira' })
  create(@TenantId() tenantId: string, @Body() dto: CreateTransactionDto) {
    return this.billingService.create(tenantId, dto);
  }

  @Put(':id')
  @Roles('ADMIN', 'FINANCIAL')
  @ApiOperation({ summary: 'Atualizar transação' })
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.billingService.update(tenantId, id, dto);
  }

  @Patch(':id/pay')
  @Roles('ADMIN', 'FINANCIAL', 'RECEPTIONIST')
  @ApiOperation({ summary: 'Marcar transação como paga' })
  markAsPaid(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body('paymentMethod') paymentMethod?: string,
    @Body('professionalId') professionalId?: string,
  ) {
    return this.billingService.markAsPaid(tenantId, id, paymentMethod, professionalId);
  }

  @Patch(':transactionId/installments/:installmentId/pay')
  @Roles('ADMIN', 'FINANCIAL')
  @ApiOperation({ summary: 'Pagar parcela específica' })
  payInstallment(
    @TenantId() tenantId: string,
    @Param('transactionId') transactionId: string,
    @Param('installmentId') installmentId: string,
  ) {
    return this.billingService.payInstallment(tenantId, transactionId, installmentId);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Excluir transação' })
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.billingService.remove(tenantId, id);
  }
}
