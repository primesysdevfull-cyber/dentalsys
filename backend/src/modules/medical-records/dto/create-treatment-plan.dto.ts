import { IsString, IsOptional, IsArray, ValidateNested, IsNumber, IsDateString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TreatmentPlanItemDto {
  @ApiPropertyOptional({ example: 'uuid-do-procedimento' })
  @IsOptional()
  @IsUUID()
  procedureId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  toothNumber?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  estimatedPrice?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;
}

export class CreateTreatmentPlanDto {
  @ApiProperty({ example: 'uuid-do-paciente' })
  @IsUUID()
  patientId: string;

  @ApiProperty({ example: 'Restauração + Limpeza' })
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  totalEstimate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  estimatedEndDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  professionalId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: [TreatmentPlanItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TreatmentPlanItemDto)
  items?: TreatmentPlanItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}
