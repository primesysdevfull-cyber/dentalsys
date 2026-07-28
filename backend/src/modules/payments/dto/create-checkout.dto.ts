import { IsString, IsNumber, IsOptional, IsUrl, IsEmail, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckoutItemDto {
  @ApiProperty({ example: 'Limpeza Dental' })
  @IsString()
  name: string;

  @ApiProperty({ example: 15000 })
  @IsNumber()
  @Min(100)
  amount: number;

  @ApiPropertyOptional({ example: 'Procedimento odontológico preventivo' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;
}

export class CreateCheckoutDto {
  @ApiProperty({ example: 'uuid-patient-id' })
  @IsString()
  patientId: string;

  @ApiPropertyOptional({ example: 15000 })
  @IsOptional()
  @IsNumber()
  @Min(100)
  amount?: number;

  @ApiPropertyOptional({ example: 'Limpeza Dental - Procedimento preventivo' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'https://clinic.example.com/payment/success' })
  @IsUrl()
  successUrl: string;

  @ApiProperty({ example: 'https://clinic.example.com/payment/cancel' })
  @IsUrl()
  cancelUrl: string;

  @ApiPropertyOptional({ example: 'patient@email.com' })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiPropertyOptional({ type: [CheckoutItemDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items?: CheckoutItemDto[];

  @ApiPropertyOptional({ example: 'txn-uuid-from-database' })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional({ example: 'BRL' })
  @IsOptional()
  @IsString()
  currency?: string;
}
