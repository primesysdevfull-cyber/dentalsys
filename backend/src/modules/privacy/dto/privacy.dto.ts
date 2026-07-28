import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export class GiveConsentDto {
  @ApiProperty() @IsString() patientId: string;
  @ApiProperty({ enum: ['TERMS_OF_USE', 'PRIVACY_POLICY', 'DATA_PROCESSING', 'MARKETING', 'SHARE_WITH_INSURANCE', 'SHARE_WITH_LAB'] })
  @IsEnum(['TERMS_OF_USE', 'PRIVACY_POLICY', 'DATA_PROCESSING', 'MARKETING', 'SHARE_WITH_INSURANCE', 'SHARE_WITH_LAB'])
  type: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() consentVersion?: string;
}

export class RevokeConsentDto {
  @ApiProperty() @IsString() patientId: string;
  @ApiProperty({ enum: ['TERMS_OF_USE', 'PRIVACY_POLICY', 'DATA_PROCESSING', 'MARKETING', 'SHARE_WITH_INSURANCE', 'SHARE_WITH_LAB'] })
  @IsEnum(['TERMS_OF_USE', 'PRIVACY_POLICY', 'DATA_PROCESSING', 'MARKETING', 'SHARE_WITH_INSURANCE', 'SHARE_WITH_LAB'])
  type: string;
}

export class RequestDataExportDto {
  @ApiProperty() @IsString() patientId: string;
}
