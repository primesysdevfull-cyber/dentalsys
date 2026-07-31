import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RecallService } from './recall.service';
import { CreateRecallCampaignDto, UpdateRecallCampaignDto } from './dto/recall.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('recall')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('recall')
export class RecallController {
  constructor(private recallService: RecallService) {}

  @Post()
  @ApiOperation({ summary: 'Criar campanha de recall' })
  create(@TenantId() tenantId: string, @Body() dto: CreateRecallCampaignDto) {
    return this.recallService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar campanhas' })
  findAll(@TenantId() tenantId: string) {
    return this.recallService.findAll(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe da campanha' })
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.recallService.findOne(tenantId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar campanha' })
  update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateRecallCampaignDto) {
    return this.recallService.update(tenantId, id, dto);
  }

  @Put(':id/toggle')
  @ApiOperation({ summary: 'Ativar/desativar campanha' })
  toggle(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.recallService.toggleStatus(tenantId, id);
  }

  @Post(':id/execute')
  @ApiOperation({ summary: 'Executar campanha agora' })
  execute(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.recallService.execute(tenantId, id);
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Logs da campanha' })
  getLogs(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.recallService.getLogs(tenantId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir campanha' })
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.recallService.remove(tenantId, id);
  }
}
