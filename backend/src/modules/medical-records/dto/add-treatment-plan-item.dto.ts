import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AddTreatmentPlanItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
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
