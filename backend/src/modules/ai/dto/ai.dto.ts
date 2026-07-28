import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class TranscribeAudioDto {
  @ApiProperty() @IsString() audioUrl: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() clinicalRecordId?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() durationSeconds?: number;
}

export class GenerateClinicalSuggestionDto {
  @ApiProperty() @IsString() patientId: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() notes?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() procedureName?: string;
}
