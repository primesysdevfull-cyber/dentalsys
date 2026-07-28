import { IsString, IsEnum, IsOptional, MinLength, IsBoolean, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional({ enum: ['ADMIN', 'DENTIST', 'ASSISTANT', 'RECEPTIONIST', 'FINANCIAL'] })
  @IsOptional()
  @IsEnum(['ADMIN', 'DENTIST', 'ASSISTANT', 'RECEPTIONIST', 'FINANCIAL'] as const)
  role?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 8, description: 'Máximo de consultas por dia (apenas para dentistas)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxAppointmentsPerDay?: number;
}
