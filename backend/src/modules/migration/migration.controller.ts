import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MigrationService } from './migration.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { UserId } from '../../common/decorators/user.decorator';

@ApiTags('migration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('migration')
export class MigrationController {
  constructor(private migrationService: MigrationService) {}

  @Get('export/all')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Exportar todos os dados (JSON)' })
  exportAll(@TenantId() tenantId: string, @UserId() userId: string) {
    return this.migrationService.exportAll(tenantId, userId);
  }

  @Get('export/patients')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Exportar pacientes' })
  exportPatients(@TenantId() tenantId: string) { return this.migrationService.exportPatients(tenantId); }

  @Get('export/appointments')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Exportar agendamentos' })
  exportAppointments(@TenantId() tenantId: string) { return this.migrationService.exportAppointments(tenantId); }

  @Post('import/patients')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Importar pacientes (JSON)' })
  importPatients(@TenantId() tenantId: string, @UserId() userId: string, @Body() data: any) {
    return this.migrationService.importPatients(tenantId, userId, data.patients || data);
  }

  @Post('import/procedures')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Importar procedimentos (JSON)' })
  importProcedures(@TenantId() tenantId: string, @UserId() userId: string, @Body() data: any) {
    return this.migrationService.importProcedures(tenantId, userId, data.procedures || data);
  }

  @Get('history')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Histórico de migrações' })
  history(@TenantId() tenantId: string) { return this.migrationService.getHistory(tenantId); }

  @Get('template/:entityType')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Obter template de importação' })
  template(@Param('entityType') entityType: string) { return this.migrationService.getTemplate(entityType); }
}
