import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsArray } from 'class-validator';

export class PublicBookingDto {
  @ApiProperty() @IsString() patientName: string;
  @ApiProperty() @IsString() patientPhone: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() patientEmail?: string;
  @ApiProperty() @IsString() professionalId: string;
  @ApiProperty() @IsDateString() startTime: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() notes?: string;
}
