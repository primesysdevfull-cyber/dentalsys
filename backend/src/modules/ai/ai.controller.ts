import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { TranscribeAudioDto, GenerateClinicalSuggestionDto } from './dto/ai.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { UserId } from '../../common/decorators/user.decorator';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('transcribe') @Roles('ADMIN', 'DENTIST')
  @ApiOperation({ summary: 'Transcrever áudio de consulta' })
  transcribe(@TenantId() tenantId: string, @UserId() userId: string, @Body() dto: TranscribeAudioDto) {
    return this.aiService.transcribe(tenantId, userId, dto);
  }

  @Post('suggest') @Roles('ADMIN', 'DENTIST')
  @ApiOperation({ summary: 'Gerar sugestão de prontuário via IA' })
  suggest(@TenantId() tenantId: string, @Body() dto: GenerateClinicalSuggestionDto) {
    return this.aiService.generateSuggestion(tenantId, dto);
  }

  @Get('transcriptions') @Roles('ADMIN', 'DENTIST')
  @ApiOperation({ summary: 'Listar transcrições' })
  listTranscriptions(@TenantId() tenantId: string) { return this.aiService.listTranscriptions(tenantId); }
}
