import { IsString, IsOptional, IsEmail, IsEnum, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SubscriptionInterval {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export class SubscriptionMetadataDto {
  @ApiPropertyOptional({ example: 'clinic-acme-dental' })
  @IsOptional()
  @IsString()
  clinicSlug?: string;

  @ApiPropertyOptional({ example: 'Plano Profissional' })
  @IsOptional()
  @IsString()
  planName?: string;

  @ApiPropertyOptional({ example: 'uuid-tenant-id' })
  @IsOptional()
  @IsString()
  tenantId?: string;
}

export class CreateSubscriptionDto {
  @ApiProperty({ example: 'price_1234567890abcdef' })
  @IsString()
  priceId: string;

  @ApiProperty({ example: 'uuid-tenant-id' })
  @IsString()
  tenantId: string;

  @ApiPropertyOptional({ example: 'tenant-admin@clinic.com' })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiPropertyOptional({ example: 'Acme Dental' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiProperty({ enum: SubscriptionInterval, example: SubscriptionInterval.MONTHLY })
  @IsEnum(SubscriptionInterval)
  interval: SubscriptionInterval;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  trialPeriod?: boolean;

  @ApiPropertyOptional({ example: 14 })
  @IsOptional()
  trialPeriodDays?: number;

  @ApiPropertyOptional({ example: 'https://clinic.example.com/billing/success' })
  @IsOptional()
  @IsString()
  successUrl?: string;

  @ApiPropertyOptional({ example: 'https://clinic.example.com/billing/cancel' })
  @IsOptional()
  @IsString()
  cancelUrl?: string;

  @ApiPropertyOptional({ type: SubscriptionMetadataDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SubscriptionMetadataDto)
  metadata?: SubscriptionMetadataDto;
}
