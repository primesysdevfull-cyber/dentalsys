import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { LabService } from './lab.service';
import { CreateLabOrderDto, UpdateLabOrderDto, ImportExamDto } from './dto/lab.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('lab')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('lab')
export class LabController {
  constructor(private labService: LabService) {}

  @Get() @Roles('ADMIN', 'DENTIST', 'ASSISTANT')
  @ApiOperation({ summary: 'Listar pedidos de laboratório' })
  findAll(@TenantId() tenantId: string, @Query('status') status?: string, @Query('type') type?: string) { return this.labService.findAll(tenantId, status, type); }

  @Get(':id') @Roles('ADMIN', 'DENTIST', 'ASSISTANT')
  @ApiOperation({ summary: 'Obter pedido' })
  findOne(@TenantId() tenantId: string, @Param('id') id: string) { return this.labService.findOne(tenantId, id); }

  @Post() @Roles('ADMIN', 'DENTIST')
  @ApiOperation({ summary: 'Criar pedido de laboratório' })
  create(@TenantId() tenantId: string, @Body() dto: CreateLabOrderDto) { return this.labService.create(tenantId, dto); }

  @Put(':id') @Roles('ADMIN', 'DENTIST')
  @ApiOperation({ summary: 'Atualizar pedido' })
  update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateLabOrderDto) { return this.labService.update(tenantId, id, dto); }

  @Post('import-exam') @Roles('ADMIN', 'DENTIST')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Importar exame laboratorial externo' })
  importExam(@TenantId() tenantId: string, @Body() dto: ImportExamDto, @UploadedFile() file?: Express.Multer.File) {
    return this.labService.importExam(tenantId, dto, file);
  }

  @Delete(':id') @Roles('ADMIN')
  @ApiOperation({ summary: 'Remover pedido' })
  remove(@TenantId() tenantId: string, @Param('id') id: string) { return this.labService.remove(tenantId, id); }
}
