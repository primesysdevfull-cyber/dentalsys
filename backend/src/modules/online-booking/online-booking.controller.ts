import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OnlineBookingService } from './online-booking.service';
import { PublicBookingDto } from './dto/booking.dto';

@ApiTags('public/booking')
@Controller('public/booking')
export class OnlineBookingController {
  constructor(private onlineBookingService: OnlineBookingService) {}

  @Get('professionals')
  @ApiOperation({ summary: 'Listar profissionais disponíveis (público)' })
  listProfessionals(@Query('tenantId') tenantId: string) { return this.onlineBookingService.listProfessionals(tenantId); }

  @Get('slots/:professionalId')
  @ApiOperation({ summary: 'Horários disponíveis (público)' })
  getSlots(@Param('professionalId') professionalId: string, @Query('date') date: string) {
    return this.onlineBookingService.getAvailableSlots(professionalId, date);
  }

  @Post()
  @ApiOperation({ summary: 'Agendar consulta (público)' })
  create(@Body() dto: PublicBookingDto) { return this.onlineBookingService.createBooking(dto); }
}
