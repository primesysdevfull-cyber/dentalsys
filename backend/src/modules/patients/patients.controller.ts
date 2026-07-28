import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { CreateMedicalHistoryDto } from './dto/create-medical-history.dto';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('patients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('patients')
export class PatientsController {
  constructor(private patientsService: PatientsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar pacientes' })
  findAll(
    @TenantId() tenantId: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('insuranceId') insuranceId?: string,
  ) {
    return this.patientsService.findAll(tenantId, { search, page, limit, insuranceId });
  }

  @Get('stats')
  @Roles('ADMIN', 'RECEPTIONIST', 'FINANCIAL')
  @ApiOperation({ summary: 'Estatísticas de pacientes' })
  getStats(@TenantId() tenantId: string) {
    return this.patientsService.getPatientStats(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter paciente por ID' })
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.patientsService.findOne(tenantId, id);
  }

  @Post()
  @Roles('ADMIN', 'RECEPTIONIST', 'DENTIST')
  @ApiOperation({ summary: 'Cadastrar novo paciente' })
  create(@TenantId() tenantId: string, @Body() dto: CreatePatientDto) {
    return this.patientsService.create(tenantId, dto);
  }

  @Put(':id')
  @Roles('ADMIN', 'RECEPTIONIST', 'DENTIST')
  @ApiOperation({ summary: 'Atualizar paciente' })
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePatientDto,
  ) {
    return this.patientsService.update(tenantId, id, dto);
  }

  @Get(':id/medical-history')
  @ApiOperation({ summary: 'Obter histórico médico' })
  getMedicalHistory(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.patientsService.getMedicalHistory(tenantId, id);
  }

  @Put(':id/medical-history')
  @Roles('ADMIN', 'DENTIST', 'ASSISTANT')
  @ApiOperation({ summary: 'Atualizar histórico médico' })
  updateMedicalHistory(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: CreateMedicalHistoryDto,
  ) {
    return this.patientsService.updateMedicalHistory(tenantId, id, dto);
  }

  @Get(':id/attachments')
  @ApiOperation({ summary: 'Listar anexos do paciente' })
  getAttachments(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Query('type') type?: string,
  ) {
    return this.patientsService.getAttachments(tenantId, id, type);
  }

  @Post(':id/attachments')
  @Roles('ADMIN', 'DENTIST', 'ASSISTANT')
  @ApiOperation({ summary: 'Adicionar anexo' })
  addAttachment(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: CreateAttachmentDto,
  ) {
    return this.patientsService.addAttachment(tenantId, id, dto);
  }

  @Delete(':patientId/attachments/:attachmentId')
  @Roles('ADMIN', 'DENTIST')
  @ApiOperation({ summary: 'Remover anexo' })
  deleteAttachment(
    @TenantId() tenantId: string,
    @Param('patientId') patientId: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.patientsService.deleteAttachment(tenantId, patientId, attachmentId);
  }

  @Post(':id/guardians')
  @Roles('ADMIN', 'RECEPTIONIST')
  @ApiOperation({ summary: 'Adicionar responsável legal' })
  addGuardian(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.patientsService.addGuardian(tenantId, id, dto);
  }

  @Delete(':patientId/guardians/:guardianId')
  @Roles('ADMIN', 'RECEPTIONIST')
  @ApiOperation({ summary: 'Remover responsável legal' })
  removeGuardian(
    @TenantId() tenantId: string,
    @Param('patientId') patientId: string,
    @Param('guardianId') guardianId: string,
  ) {
    return this.patientsService.removeGuardian(tenantId, patientId, guardianId);
  }
}
