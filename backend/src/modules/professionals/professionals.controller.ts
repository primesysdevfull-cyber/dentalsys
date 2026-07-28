import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProfessionalsService } from './professionals.service';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('professionals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('professionals')
export class ProfessionalsController {
  constructor(private professionalsService: ProfessionalsService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Criar profissional' })
  create(@TenantId() tenantId: string, @Body() dto: CreateProfessionalDto) {
    return this.professionalsService.create(tenantId, dto);
  }

  @Get()
  @Roles('ADMIN', 'DENTIST', 'ASSISTANT', 'RECEPTIONIST')
  @ApiOperation({ summary: 'Listar profissionais' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'isActive', required: false })
  findAll(
    @TenantId() tenantId: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.professionalsService.findAll(tenantId, { search, isActive });
  }

  @Get('commissions')
  @Roles('ADMIN', 'FINANCIAL')
  @ApiOperation({ summary: 'Resumo de comissões por profissional' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getCommissionSummary(
    @TenantId() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.professionalsService.getCommissionSummary(tenantId, { startDate, endDate });
  }

  @Get(':id')
  @Roles('ADMIN', 'DENTIST', 'ASSISTANT', 'RECEPTIONIST')
  @ApiOperation({ summary: 'Obter profissional por ID' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.professionalsService.findOne(id, tenantId);
  }

  @Put(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Atualizar profissional' })
  update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateProfessionalDto,
  ) {
    return this.professionalsService.update(id, tenantId, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Remover profissional' })
  remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.professionalsService.remove(id, tenantId);
  }
}
