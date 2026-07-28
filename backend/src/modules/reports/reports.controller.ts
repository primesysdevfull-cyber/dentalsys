import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'FINANCIAL')
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('appointments')
  @ApiOperation({ summary: 'Relatório de agendamentos' })
  getAppointmentsReport(
    @TenantId() tenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getAppointmentsReport(tenantId, startDate, endDate);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Relatório de receita' })
  getRevenueReport(
    @TenantId() tenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getRevenueReport(tenantId, startDate, endDate);
  }

  @Get('occupancy')
  @ApiOperation({ summary: 'Relatório de ocupação' })
  getOccupancyReport(
    @TenantId() tenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getOccupancyReport(tenantId, startDate, endDate);
  }

  @Get('professional-performance')
  @ApiOperation({ summary: 'Desempenho por profissional' })
  getProfessionalPerformance(
    @TenantId() tenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getProfessionalPerformance(tenantId, startDate, endDate);
  }

  @Get('procedures')
  @ApiOperation({ summary: 'Procedimentos mais realizados' })
  getMostProcedures(
    @TenantId() tenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getMostProceduresReport(tenantId, startDate, endDate);
  }

  @Get('delinquency')
  @ApiOperation({ summary: 'Relatório de inadimplência' })
  getDelinquencyReport(@TenantId() tenantId: string) {
    return this.reportsService.getDelinquencyReport(tenantId);
  }

  @Get('productivity')
  @ApiOperation({ summary: 'Produtividade por médico (agendados vs atendidos)' })
  getProductivityReport(
    @TenantId() tenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getProductivityReport(tenantId, startDate, endDate);
  }
}
