import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NfeService } from './nfe.service';
import { NfeConfigService } from './nfe-config.service';
import { CreateNfeConfigDto, UpdateNfeConfigDto } from './dto/create-nfe-config.dto';
import { EmitNfeDto } from './dto/emit-nfe.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('nfe')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('nfe')
export class NfeController {
  constructor(
    private nfeService: NfeService,
    private nfeConfigService: NfeConfigService,
  ) {}

  // Config endpoints
  @Get('config')
  @Roles('ADMIN', 'FINANCIAL')
  @ApiOperation({ summary: 'Listar configurações NF-e' })
  listConfig(@TenantId() tenantId: string) {
    return this.nfeConfigService.findAll(tenantId);
  }

  @Get('config/:id')
  @Roles('ADMIN', 'FINANCIAL')
  @ApiOperation({ summary: 'Obter configuração NF-e' })
  getConfig(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.nfeConfigService.findOne(tenantId, id);
  }

  @Post('config')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Criar configuração NF-e' })
  createConfig(@TenantId() tenantId: string, @Body() dto: CreateNfeConfigDto) {
    return this.nfeConfigService.create(tenantId, dto);
  }

  @Put('config/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Atualizar configuração NF-e' })
  updateConfig(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateNfeConfigDto) {
    return this.nfeConfigService.update(tenantId, id, dto);
  }

  @Delete('config/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Remover configuração NF-e' })
  removeConfig(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.nfeConfigService.remove(tenantId, id);
  }

  // Invoice endpoints
  @Post('emitir')
  @Roles('ADMIN', 'FINANCIAL')
  @ApiOperation({ summary: 'Emitir NF-e para uma transação' })
  emitir(@TenantId() tenantId: string, @Body() dto: EmitNfeDto) {
    return this.nfeService.emitir(tenantId, dto.transactionId, dto.provider);
  }

  @Get('invoices')
  @Roles('ADMIN', 'FINANCIAL')
  @ApiOperation({ summary: 'Listar notas fiscais emitidas' })
  listInvoices(@TenantId() tenantId: string, @Query('transactionId') transactionId?: string) {
    return this.nfeService.listar(tenantId, transactionId);
  }

  @Post('invoices/:id/cancel')
  @Roles('ADMIN', 'FINANCIAL')
  @ApiOperation({ summary: 'Cancelar nota fiscal' })
  cancelInvoice(@TenantId() tenantId: string, @Param('id') id: string, @Body('reason') reason: string) {
    return this.nfeService.cancelar(tenantId, id, reason);
  }

  @Get('invoices/:id/consult')
  @Roles('ADMIN', 'FINANCIAL')
  @ApiOperation({ summary: 'Consultar situação da nota fiscal' })
  consultInvoice(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.nfeService.consultar(tenantId, id);
  }
}
