import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProceduresService } from './procedures.service';
import { CreateProcedureDto } from './dto/create-procedure.dto';
import { UpdateProcedureDto } from './dto/update-procedure.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('procedures')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('procedures')
export class ProceduresController {
  constructor(private proceduresService: ProceduresService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Criar procedimento' })
  create(@TenantId() tenantId: string, @Body() dto: CreateProcedureDto) {
    return this.proceduresService.create(tenantId, dto);
  }

  @Get()
  @Roles('ADMIN', 'DENTIST', 'ASSISTANT', 'RECEPTIONIST')
  @ApiOperation({ summary: 'Listar procedimentos' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'isActive', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(
    @TenantId() tenantId: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('isActive') isActive?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.proceduresService.findAll(tenantId, {
      search,
      category,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      page,
      limit,
    });
  }

  @Get('categories')
  @Roles('ADMIN', 'DENTIST', 'ASSISTANT', 'RECEPTIONIST')
  @ApiOperation({ summary: 'Listar categorias de procedimentos' })
  getCategories(@TenantId() tenantId: string) {
    return this.proceduresService.getCategories(tenantId);
  }

  @Get('stats')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Estatísticas de procedimentos' })
  getStats(@TenantId() tenantId: string) {
    return this.proceduresService.getStats(tenantId);
  }

  @Get(':id')
  @Roles('ADMIN', 'DENTIST', 'ASSISTANT', 'RECEPTIONIST')
  @ApiOperation({ summary: 'Obter procedimento por ID' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.proceduresService.findOne(id, tenantId);
  }

  @Put(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Atualizar procedimento' })
  update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateProcedureDto,
  ) {
    return this.proceduresService.update(id, tenantId, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Remover procedimento' })
  remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.proceduresService.remove(id, tenantId);
  }
}
