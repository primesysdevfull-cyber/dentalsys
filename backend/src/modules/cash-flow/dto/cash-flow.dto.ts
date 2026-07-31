import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsString } from 'class-validator';

export class CashFlowQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsDateString() startDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endDate?: string;
}

export class CloseDayDto {
  @ApiProperty() @IsDateString() closureDate: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class DailySummaryDto {
  date: string;
  income: number;
  expense: number;
  balance: number;
  transactions: number;
  closed: boolean;
}
