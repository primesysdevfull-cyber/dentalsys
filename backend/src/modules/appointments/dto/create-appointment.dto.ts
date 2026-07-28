import { IsString, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty({ description: 'ID do paciente' })
  @IsString()
  patientId: string;

  @ApiProperty({ description: 'ID do profissional' })
  @IsString()
  professionalId: string;

  @ApiPropertyOptional({ description: 'ID da sala' })
  @IsOptional()
  @IsString()
  roomId?: string;

  @ApiPropertyOptional({ description: 'ID do procedimento' })
  @IsOptional()
  @IsString()
  procedureId?: string;

  @ApiProperty({ example: '2024-03-15T09:00:00.000Z' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: '2024-03-15T09:30:00.000Z' })
  @IsDateString()
  endTime: string;

  @ApiPropertyOptional({ enum: ['WALK_IN', 'PHONE', 'WEBSITE', 'WHATSAPP', 'SYSTEM'] })
  @IsOptional()
  @IsEnum(['WALK_IN', 'PHONE', 'WEBSITE', 'WHATSAPP', 'SYSTEM'] as const)
  source?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'ID do agendamento original (para remarcar)' })
  @IsOptional()
  @IsString()
  rescheduledFromId?: string;
}
