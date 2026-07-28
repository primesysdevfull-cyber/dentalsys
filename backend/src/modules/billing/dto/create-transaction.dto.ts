import { IsString, IsNumber, IsOptional, IsEnum, IsDateString, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTransactionDto {
  @ApiProperty({ enum: ['INCOME', 'EXPENSE'] })
  @IsEnum(['INCOME', 'EXPENSE'] as const)
  type: string;

  @ApiPropertyOptional({ example: 'uuid-do-paciente' })
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @ApiPropertyOptional({ example: 'uuid-do-procedimento' })
  @IsOptional()
  @IsUUID()
  procedureId?: string;

  @ApiPropertyOptional({ example: 'uuid-do-profissional' })
  @IsOptional()
  @IsUUID()
  professionalId?: string;

  @ApiProperty({ example: 'Consulta de rotina' })
  @IsString()
  description: string;

  @ApiProperty({ example: 150.00 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ example: 10.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({ enum: ['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'PIX', 'BOLETO', 'INSURANCE', 'OTHER'] })
  @IsOptional()
  @IsEnum(['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'PIX', 'BOLETO', 'INSURANCE', 'OTHER'] as const)
  paymentMethod?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  totalInstallments?: number;

  @ApiPropertyOptional({ example: 'CONSULTA' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'Observações' })
  @IsOptional()
  @IsString()
  notes?: string;
}
