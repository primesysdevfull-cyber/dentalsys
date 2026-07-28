import {
  Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ClinicalRecordsService } from './clinical-records.service';
import { CreateClinicalRecordDto } from './dto/create-clinical-record.dto';
import { UpdateOdontogramDto } from './dto/update-odontogram.dto';
import { CreateTreatmentPlanDto } from './dto/create-treatment-plan.dto';
import { AddTreatmentPlanItemDto } from './dto/add-treatment-plan-item.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('clinical-records')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class ClinicalRecordsController {
  constructor(private clinicalRecordsService: ClinicalRecordsService) {}

  // ============ PRONTUÁRIO ============

  @Get('clinical-records/patient/:patientId')
  @ApiOperation({ summary: 'Prontuário do paciente' })
  findByPatient(@TenantId() tenantId: string, @Param('patientId') patientId: string) {
    return this.clinicalRecordsService.findByPatient(tenantId, patientId);
  }

  @Get('clinical-records/:id')
  @ApiOperation({ summary: 'Obter prontuário por ID' })
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.clinicalRecordsService.findOne(tenantId, id);
  }

  @Post('clinical-records')
  @Roles('ADMIN', 'DENTIST', 'ASSISTANT')
  @ApiOperation({ summary: 'Criar registro clínico' })
  create(@TenantId() tenantId: string, @Body() dto: CreateClinicalRecordDto) {
    return this.clinicalRecordsService.create(tenantId, dto);
  }

  @Put('clinical-records/:id')
  @Roles('ADMIN', 'DENTIST')
  @ApiOperation({ summary: 'Atualizar registro clínico' })
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateClinicalRecordDto>,
  ) {
    return this.clinicalRecordsService.update(tenantId, id, dto);
  }

  // ============ ODONTOGRAMA ============

  @Get('odontogram/:patientId')
  @ApiOperation({ summary: 'Obter odontograma do paciente' })
  getOdontogram(@TenantId() tenantId: string, @Param('patientId') patientId: string) {
    return this.clinicalRecordsService.getOdontogram(tenantId, patientId);
  }

  @Put('odontogram/:patientId')
  @Roles('ADMIN', 'DENTIST')
  @ApiOperation({ summary: 'Atualizar odontograma completo' })
  updateOdontogram(
    @TenantId() tenantId: string,
    @Param('patientId') patientId: string,
    @Body() dto: UpdateOdontogramDto,
  ) {
    return this.clinicalRecordsService.updateOdontogram(tenantId, patientId, dto);
  }

  @Post('odontogram/:patientId/tooth')
  @Roles('ADMIN', 'DENTIST')
  @ApiOperation({ summary: 'Adicionar condição a um dente' })
  updateSingleTooth(
    @TenantId() tenantId: string,
    @Param('patientId') patientId: string,
    @Body() body: { toothNumber: number; condition: string; notes?: string; surface?: string },
  ) {
    return this.clinicalRecordsService.updateSingleTooth(
      tenantId, patientId, body.toothNumber, body.condition, body.notes, body.surface,
    );
  }

  @Delete('odontogram/tooth/:toothConditionId')
  @Roles('ADMIN', 'DENTIST')
  @ApiOperation({ summary: 'Remover condição do dente' })
  removeToothCondition(
    @TenantId() tenantId: string,
    @Param('toothConditionId') toothConditionId: string,
  ) {
    return this.clinicalRecordsService.removeToothCondition(tenantId, toothConditionId);
  }

  // ============ PLANOS DE TRATAMENTO ============

  @Get('treatment-plans/:patientId')
  @ApiOperation({ summary: 'Planos de tratamento do paciente' })
  findTreatmentPlans(
    @TenantId() tenantId: string,
    @Param('patientId') patientId: string,
  ) {
    return this.clinicalRecordsService.findTreatmentPlans(tenantId, patientId);
  }

  @Get('treatment-plan/:id')
  @ApiOperation({ summary: 'Obter plano de tratamento por ID' })
  findOneTreatmentPlan(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.clinicalRecordsService.findOneTreatmentPlan(tenantId, id);
  }

  @Post('treatment-plan')
  @Roles('ADMIN', 'DENTIST')
  @ApiOperation({ summary: 'Criar plano de tratamento' })
  createTreatmentPlan(
    @TenantId() tenantId: string,
    @Body() dto: CreateTreatmentPlanDto,
  ) {
    return this.clinicalRecordsService.createTreatmentPlan(tenantId, dto);
  }

  @Put('treatment-plan/:id')
  @Roles('ADMIN', 'DENTIST')
  @ApiOperation({ summary: 'Atualizar plano de tratamento' })
  updateTreatmentPlan(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateTreatmentPlanDto>,
  ) {
    return this.clinicalRecordsService.updateTreatmentPlan(tenantId, id, dto);
  }

  @Post('treatment-plan/:planId/items')
  @Roles('ADMIN', 'DENTIST')
  @ApiOperation({ summary: 'Adicionar item ao plano' })
  addItem(
    @TenantId() tenantId: string,
    @Param('planId') planId: string,
    @Body() dto: AddTreatmentPlanItemDto,
  ) {
    return this.clinicalRecordsService.addItemToTreatmentPlan(tenantId, planId, dto);
  }

  @Delete('treatment-plan/:planId/items/:itemId')
  @Roles('ADMIN', 'DENTIST')
  @ApiOperation({ summary: 'Remover item do plano' })
  removeItem(
    @TenantId() tenantId: string,
    @Param('planId') planId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.clinicalRecordsService.removeItemFromTreatmentPlan(tenantId, planId, itemId);
  }

  @Patch('treatment-plan/:id/accept')
  @Roles('ADMIN', 'DENTIST')
  @ApiOperation({ summary: 'Aceitar plano de tratamento e gerar lançamento financeiro' })
  acceptPlan(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.clinicalRecordsService.acceptTreatmentPlan(tenantId, id);
  }

  @Patch('treatment-plan/:id/start')
  @Roles('ADMIN', 'DENTIST')
  @ApiOperation({ summary: 'Iniciar plano de tratamento' })
  startPlan(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.clinicalRecordsService.startTreatmentPlan(tenantId, id);
  }

  @Patch('treatment-plan/:id/cancel')
  @Roles('ADMIN', 'DENTIST')
  @ApiOperation({ summary: 'Cancelar plano de tratamento' })
  cancelPlan(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.clinicalRecordsService.cancelTreatmentPlan(tenantId, id);
  }

  @Patch('treatment-plan/:id/complete')
  @Roles('ADMIN', 'DENTIST')
  @ApiOperation({ summary: 'Concluir plano de tratamento' })
  completePlan(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.clinicalRecordsService.completeTreatmentPlan(tenantId, id);
  }
}
