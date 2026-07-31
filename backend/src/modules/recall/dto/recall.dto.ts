import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';

export enum RecallType {
  ABSENT = 'ABSENT',
  BIRTHDAY = 'BIRTHDAY',
  INCOMPLETE_TREATMENT = 'INCOMPLETE_TREATMENT',
  CUSTOM = 'CUSTOM',
}

export enum CampaignStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class CreateRecallCampaignDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty({ enum: RecallType }) @IsEnum(RecallType) type: RecallType;
  @ApiPropertyOptional() @IsOptional() @IsObject() config?: Record<string, any>;
  @ApiProperty() @IsString() message: string;
  @ApiPropertyOptional() @IsOptional() @IsString() channel?: string;
}

export class UpdateRecallCampaignDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() config?: Record<string, any>;
  @ApiPropertyOptional() @IsOptional() @IsString() message?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() channel?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(CampaignStatus) status?: string;
}
