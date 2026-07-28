import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber, IsPositive, Min } from 'class-validator';

export class CreateProcedureDto {
  @ApiPropertyOptional({ example: 'D0120' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ example: 'Restauração - Amálgama' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Restaurações' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ example: 150.0 })
  @IsNumber()
  @IsPositive()
  defaultPrice: number;

  @ApiPropertyOptional({ example: 120.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  insurancePrice?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(5)
  durationMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requiresAuthorization?: boolean;
}
