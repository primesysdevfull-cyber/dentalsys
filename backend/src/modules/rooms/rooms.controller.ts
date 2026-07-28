import {
  Controller, Get, Post, Put, Delete, Body, Param, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('rooms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rooms')
export class RoomsController {
  constructor(private roomsService: RoomsService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Criar sala' })
  create(@TenantId() tenantId: string, @Body() dto: CreateRoomDto) {
    return this.roomsService.create(tenantId, dto);
  }

  @Get()
  @Roles('ADMIN', 'DENTIST', 'ASSISTANT', 'RECEPTIONIST')
  @ApiOperation({ summary: 'Listar salas' })
  findAll(@TenantId() tenantId: string) {
    return this.roomsService.findAll(tenantId);
  }

  @Get('stats')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Estatísticas de salas' })
  getStats(@TenantId() tenantId: string) {
    return this.roomsService.getStats(tenantId);
  }

  @Get(':id')
  @Roles('ADMIN', 'DENTIST', 'ASSISTANT', 'RECEPTIONIST')
  @ApiOperation({ summary: 'Obter sala por ID' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.roomsService.findOne(id, tenantId);
  }

  @Put(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Atualizar sala' })
  update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateRoomDto,
  ) {
    return this.roomsService.update(id, tenantId, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Remover sala' })
  remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.roomsService.remove(id, tenantId);
  }
}
