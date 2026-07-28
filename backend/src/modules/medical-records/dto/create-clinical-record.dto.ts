import { IsString, IsOptional, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClinicalRecordDto {
  @ApiPropertyOptional({ example: 'uuid-do-agendamento' })
  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @ApiProperty({ example: 'uuid-do-paciente' })
  @IsUUID()
  patientId: string;

  @ApiPropertyOptional({ example: 'uuid-do-procedimento' })
  @IsOptional()
  @IsUUID()
  procedureId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  diagnosis?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  treatmentDone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  prescriptions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observations?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nextAppointment?: string;
}
