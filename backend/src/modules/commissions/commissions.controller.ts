import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommissionsService } from './commissions.service';
import { CreateCommissionDto, QueryCommissionsDto, PayCommissionDto } from './dto/commissions.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { UserId } from '../../common/decorators/user.decorator';

@ApiTags('commissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'FINANCIAL', 'DENTIST')
@Controller('commissions')
export class CommissionsController {
  constructor(private commissionsService: CommissionsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar comissão manualmente' })
  create(@TenantId() tenantId: string, @Body() dto: CreateCommissionDto) {
    return this.commissionsService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar comissões' })
  findAll(@TenantId() tenantId: string, @Query() query: QueryCommissionsDto) {
    return this.commissionsService.findAll(tenantId, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Resumo de comissões' })
  stats(@TenantId() tenantId: string, @Query() query: QueryCommissionsDto) {
    return this.commissionsService.getSummary(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe da comissão' })
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.commissionsService.findOne(tenantId, id);
  }

  @Put(':id/pay')
  @ApiOperation({ summary: 'Marcar comissão como paga' })
  pay(@TenantId() tenantId: string, @Param('id') id: string, @UserId() userId: string, @Body() dto: PayCommissionDto) {
    return this.commissionsService.pay(tenantId, id, userId, dto.notes);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancelar comissão' })
  cancel(@TenantId() tenantId: string, @Param('id') id: string, @Body('reason') reason?: string) {
    return this.commissionsService.cancel(tenantId, id, reason);
  }
}
