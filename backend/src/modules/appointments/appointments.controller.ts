import {
  Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar agendamentos' })
  findAll(
    @TenantId() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('professionalId') professionalId?: string,
    @Query('roomId') roomId?: string,
    @Query('status') status?: string,
    @Query('patientId') patientId?: string,
    @Query('page') page?: number,
  ) {
    return this.appointmentsService.findAll(tenantId, {
      startDate, endDate, professionalId, roomId, status, patientId, page,
    });
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Visão do calendário' })
  getCalendar(
    @TenantId() tenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('professionalId') professionalId?: string,
  ) {
    return this.appointmentsService.getCalendarView(tenantId, startDate, endDate, professionalId);
  }

  @Get('available-slots')
  @ApiOperation({ summary: 'Horários disponíveis' })
  getAvailableSlots(
    @TenantId() tenantId: string,
    @Query('professionalId') professionalId: string,
    @Query('date') date: string,
    @Query('procedureId') procedureId?: string,
  ) {
    return this.appointmentsService.getAvailableSlots(tenantId, professionalId, date, procedureId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter agendamento por ID' })
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.appointmentsService.findOne(tenantId, id);
  }

  @Post()
  @Roles('ADMIN', 'DENTIST', 'RECEPTIONIST', 'ASSISTANT')
  @ApiOperation({ summary: 'Criar agendamento' })
  create(@TenantId() tenantId: string, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(tenantId, dto);
  }

  @Put(':id')
  @Roles('ADMIN', 'DENTIST', 'RECEPTIONIST')
  @ApiOperation({ summary: 'Atualizar agendamento' })
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(tenantId, id, dto);
  }

  @Patch(':id/confirm')
  @Roles('ADMIN', 'RECEPTIONIST', 'ASSISTANT')
  @ApiOperation({ summary: 'Confirmar agendamento' })
  confirm(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.appointmentsService.confirm(tenantId, id);
  }

  @Patch(':id/start')
  @Roles('ADMIN', 'DENTIST')
  @ApiOperation({ summary: 'Iniciar atendimento' })
  startSession(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.appointmentsService.startSession(tenantId, id);
  }

  @Patch(':id/complete')
  @Roles('ADMIN', 'DENTIST')
  @ApiOperation({ summary: 'Concluir atendimento' })
  complete(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.appointmentsService.complete(tenantId, id);
  }

  @Patch(':id/cancel')
  @Roles('ADMIN', 'DENTIST', 'RECEPTIONIST')
  @ApiOperation({ summary: 'Cancelar agendamento' })
  cancel(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.appointmentsService.cancel(tenantId, id, reason);
  }

  @Post(':id/reschedule')
  @Roles('ADMIN', 'DENTIST', 'RECEPTIONIST')
  @ApiOperation({ summary: 'Remarcar agendamento' })
  reschedule(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: CreateAppointmentDto,
  ) {
    return this.appointmentsService.reschedule(tenantId, id, dto);
  }
}
