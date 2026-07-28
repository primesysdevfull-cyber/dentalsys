import { Controller, Get, Post, Put, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles('ADMIN', 'RECEPTIONIST')
  @ApiOperation({ summary: 'Listar usuários da clínica' })
  @ApiQuery({ name: 'role', required: false })
  findAll(@TenantId() tenantId: string, @Query('role') role?: string) {
    return this.usersService.findAll(tenantId, role);
  }

  @Get(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Obter usuário por ID' })
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.usersService.findOne(tenantId, id);
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Criar novo usuário' })
  create(@TenantId() tenantId: string, @Body() dto: CreateUserDto) {
    return this.usersService.create(tenantId, dto);
  }

  @Put(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Atualizar usuário' })
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(tenantId, id, dto);
  }

  @Patch(':id/toggle-active')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Ativar/desativar usuário' })
  toggleActive(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.usersService.toggleActive(tenantId, id);
  }
}
