import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, Min, Max, IsDateString } from 'class-validator';

export enum CommissionStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export class CreateCommissionDto {
  @ApiProperty() @IsString() professionalId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() transactionId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() appointmentId?: string;
  @ApiProperty() @IsString() description: string;
  @ApiProperty() @IsNumber() @Min(0) amount: number;
  @ApiProperty() @IsNumber() @Min(0) @Max(100) rate: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class QueryCommissionsDto {
  @ApiPropertyOptional() @IsOptional() @IsString() professionalId?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(CommissionStatus) status?: CommissionStatus;
  @ApiPropertyOptional() @IsOptional() @IsDateString() startDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
}

export class PayCommissionDto {
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
