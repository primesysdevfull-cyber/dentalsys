import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('tenants')
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Get('current')
  @ApiOperation({ summary: 'Obter dados da clínica atual' })
  getCurrent(@TenantId() tenantId: string) {
    return this.tenantsService.findOne(tenantId);
  }

  @Put('current')
  @ApiOperation({ summary: 'Atualizar dados da clínica' })
  updateCurrent(@TenantId() tenantId: string, @Body() dto: any) {
    return this.tenantsService.update(tenantId, dto);
  }

  @Put('current/settings')
  @ApiOperation({ summary: 'Atualizar configurações da clínica' })
  updateSettings(@TenantId() tenantId: string, @Body() dto: Record<string, any>) {
    return this.tenantsService.updateSettings(tenantId, dto);
  }

  @Get('current/subscription')
  @ApiOperation({ summary: 'Obter assinatura da clínica' })
  getSubscription(@TenantId() tenantId: string) {
    return this.tenantsService.getSubscription(tenantId);
  }
}
