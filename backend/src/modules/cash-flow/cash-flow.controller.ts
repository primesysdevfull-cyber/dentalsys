import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CashFlowService } from './cash-flow.service';
import { CashFlowQueryDto, CloseDayDto } from './dto/cash-flow.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { UserId } from '../../common/decorators/user.decorator';

@ApiTags('cash-flow')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'FINANCIAL')
@Controller('cash-flow')
export class CashFlowController {
  constructor(private cashFlowService: CashFlowService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Resumo financeiro do período' })
  getSummary(@TenantId() tenantId: string, @Query() query: CashFlowQueryDto) {
    return this.cashFlowService.getPeriodSummary(tenantId, query);
  }

  @Get('daily')
  @ApiOperation({ summary: 'Resumo diário (gráfico)' })
  getDaily(@TenantId() tenantId: string, @Query() query: CashFlowQueryDto) {
    return this.cashFlowService.getDailySummary(tenantId, query);
  }

  @Post('close')
  @ApiOperation({ summary: 'Fechar o dia' })
  closeDay(@TenantId() tenantId: string, @UserId() userId: string, @Body() dto: CloseDayDto) {
    return this.cashFlowService.closeDay(tenantId, dto.closureDate, userId, dto.notes);
  }

  @Get('closures')
  @ApiOperation({ summary: 'Histórico de fechamentos' })
  getClosures(@TenantId() tenantId: string, @Query() query: CashFlowQueryDto) {
    return this.cashFlowService.getClosures(tenantId, query);
  }
}
