import {
  Controller, Get, Post, Put, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { CreateMovementDto } from './dto/create-movement.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get()
  @Roles('ADMIN', 'ASSISTANT', 'FINANCIAL')
  @ApiOperation({ summary: 'Listar itens do estoque' })
  findAll(
    @TenantId() tenantId: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('lowStock') lowStock?: boolean,
    @Query('page') page?: number,
  ) {
    return this.inventoryService.findAll(tenantId, { search, category, lowStock, page });
  }

  @Get('stats')
  @Roles('ADMIN', 'FINANCIAL')
  @ApiOperation({ summary: 'Estatísticas do estoque' })
  getStats(@TenantId() tenantId: string) {
    return this.inventoryService.getStats(tenantId);
  }

  @Get('alerts/low-stock')
  @Roles('ADMIN', 'ASSISTANT')
  @ApiOperation({ summary: 'Alertas de estoque baixo' })
  getLowStockAlert(@TenantId() tenantId: string) {
    return this.inventoryService.getLowStockAlert(tenantId);
  }

  @Get('alerts/expiring')
  @Roles('ADMIN', 'ASSISTANT')
  @ApiOperation({ summary: 'Alertas de validade' })
  getExpiringAlert(
    @TenantId() tenantId: string,
    @Query('days') days?: number,
  ) {
    return this.inventoryService.getExpiringAlert(tenantId, days);
  }

  @Get(':id')
  @Roles('ADMIN', 'ASSISTANT')
  @ApiOperation({ summary: 'Obter item por ID' })
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.inventoryService.findOne(tenantId, id);
  }

  @Post()
  @Roles('ADMIN', 'ASSISTANT')
  @ApiOperation({ summary: 'Cadastrar item' })
  create(@TenantId() tenantId: string, @Body() dto: CreateInventoryItemDto) {
    return this.inventoryService.create(tenantId, dto);
  }

  @Put(':id')
  @Roles('ADMIN', 'ASSISTANT')
  @ApiOperation({ summary: 'Atualizar item' })
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateInventoryItemDto,
  ) {
    return this.inventoryService.update(tenantId, id, dto);
  }

  @Post(':itemId/movements')
  @Roles('ADMIN', 'ASSISTANT', 'FINANCIAL')
  @ApiOperation({ summary: 'Registrar movimentação de estoque' })
  addMovement(
    @TenantId() tenantId: string,
    @Param('itemId') itemId: string,
    @Body() dto: CreateMovementDto,
  ) {
    return this.inventoryService.addMovement(tenantId, itemId, dto);
  }
}
