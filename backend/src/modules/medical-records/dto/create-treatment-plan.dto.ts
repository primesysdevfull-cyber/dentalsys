import { IsString, IsOptional, IsArray, ValidateNested, IsNumber, IsDateString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class TreatmentPlanItemDto {
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
}

export class CreateTreatmentPlanDto {
  @ApiProperty({ example: 'uuid-do-paciente' })
  @IsUUID()
  patientId: string;

  @ApiProperty({ example: 'Tratamento canal + coroa' })
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
