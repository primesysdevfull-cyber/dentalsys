import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InsurancesService } from './insurances.service';
import { CreateInsuranceDto, UpdateInsuranceDto } from './dto/create-insurance.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('insurances')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('insurances')
export class InsurancesController {
  constructor(private insurancesService: InsurancesService) {}

  @Get() @Roles('ADMIN', 'FINANCIAL', 'RECEPTIONIST')
  @ApiOperation({ summary: 'Listar convênios' })
  findAll(@TenantId() tenantId: string) { return this.insurancesService.findAll(tenantId); }

  @Get(':id') @Roles('ADMIN', 'FINANCIAL', 'RECEPTIONIST')
  @ApiOperation({ summary: 'Obter convênio' })
  findOne(@TenantId() tenantId: string, @Param('id') id: string) { return this.insurancesService.findOne(tenantId, id); }

  @Post() @Roles('ADMIN')
  @ApiOperation({ summary: 'Criar convênio' })
  create(@TenantId() tenantId: string, @Body() dto: CreateInsuranceDto) { return this.insurancesService.create(tenantId, dto); }

  @Put(':id') @Roles('ADMIN')
  @ApiOperation({ summary: 'Atualizar convênio' })
  update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateInsuranceDto) { return this.insurancesService.update(tenantId, id, dto); }

  @Delete(':id') @Roles('ADMIN')
  @ApiOperation({ summary: 'Remover convênio' })
  remove(@TenantId() tenantId: string, @Param('id') id: string) { return this.insurancesService.remove(tenantId, id); }
}
