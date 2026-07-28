import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrivacyService } from './privacy.service';
import { GiveConsentDto, RevokeConsentDto, RequestDataExportDto } from './dto/privacy.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { UserId } from '../../common/decorators/user.decorator';

@ApiTags('privacy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('privacy')
export class PrivacyController {
  constructor(private privacyService: PrivacyService) {}

  @Get('consents') @Roles('ADMIN', 'DENTIST')
  @ApiOperation({ summary: 'Listar consentimentos' })
  listConsents(@TenantId() tenantId: string, @Body('patientId') patientId?: string) {
    return this.privacyService.getConsents(tenantId, patientId);
  }

  @Post('consents') @Roles('ADMIN', 'DENTIST', 'RECEPTIONIST')
  @ApiOperation({ summary: 'Registrar consentimento' })
  giveConsent(@TenantId() tenantId: string, @Body() dto: GiveConsentDto) {
    return this.privacyService.giveConsent(tenantId, dto);
  }

  @Post('consents/revoke') @Roles('ADMIN')
  @ApiOperation({ summary: 'Revogar consentimento' })
  revokeConsent(@TenantId() tenantId: string, @Body() dto: RevokeConsentDto) {
    return this.privacyService.revokeConsent(tenantId, dto);
  }

  @Post('export') @Roles('ADMIN')
  @ApiOperation({ summary: 'Solicitar exportação de dados' })
  exportData(@TenantId() tenantId: string, @Body() dto: RequestDataExportDto, @UserId() userId: string) {
    return this.privacyService.requestDataExport(tenantId, dto, userId);
  }

  @Get('exports') @Roles('ADMIN')
  @ApiOperation({ summary: 'Listar solicitações de exportação' })
  listExports(@TenantId() tenantId: string) { return this.privacyService.getExportRequests(tenantId); }

  @Post('anonymize/:patientId') @Roles('ADMIN')
  @ApiOperation({ summary: 'Anonimizar dados do paciente (LGPD)' })
  anonymize(@TenantId() tenantId: string, @Param('patientId') patientId: string) {
    return this.privacyService.anonymizePatient(tenantId, patientId);
  }
}
