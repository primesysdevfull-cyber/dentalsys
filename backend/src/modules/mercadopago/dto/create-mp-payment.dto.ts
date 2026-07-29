import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum MpPaymentMethod {
  PIX = 'PIX',
  BOLETO = 'BOLETO',
  CREDIT_CARD = 'CREDIT_CARD',
}

export class CreateMpPaymentDto {
  @ApiProperty({ example: 'uuid-patient-id' })
  @IsString()
  patientId: string;

  @ApiProperty({ example: 150.00 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: 'Consulta Odontológica' })
  @IsString()
  description: string;

  @ApiProperty({ enum: MpPaymentMethod })
  @IsEnum(MpPaymentMethod)
  paymentMethod: MpPaymentMethod;

  @ApiPropertyOptional({ example: '123.456.789-00' })
  @IsOptional()
  @IsString()
  cpf?: string;

  @ApiPropertyOptional({ example: 'uuid-transaction-id' })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional({ example: 'card_token_from_frontend' })
  @IsOptional()
  @IsString()
  cardToken?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  installments?: number;

  @ApiPropertyOptional({ example: 'paciente@email.com' })
  @IsOptional()
  @IsString()
  email?: string;
}
