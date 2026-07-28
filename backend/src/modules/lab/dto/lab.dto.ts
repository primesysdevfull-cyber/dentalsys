import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsInt, IsEnum, IsBoolean, IsArray } from 'class-validator';

export class CreateLabOrderItemDto {
  @ApiProperty() @IsString() description: string;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() toothNumber?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() material?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() color?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() quantity?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() unitPrice?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() notes?: string;
}

export class CreateLabOrderDto {
  @ApiProperty() @IsString() patientId: string;
  @ApiProperty() @IsString() professionalId: string;
  @ApiProperty() @IsString() labName: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() labContact?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() orderNumber?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() deliveryDate?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() notes?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsArray() items?: CreateLabOrderItemDto[];
}

export class UpdateLabOrderDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() labName?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() labContact?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() orderNumber?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsEnum(['PENDING', 'SENT', 'IN_PROGRESS', 'COMPLETED', 'DELIVERED', 'CANCELLED']) status?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() deliveryDate?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() notes?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() totalCost?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() paid?: boolean;
}

const ExamTypes = [
  'HEMOGRAMA', 'GLICEMIA', 'COLESTEROL', 'TRIGLICERIDES', 'URINA',
  'RAIO_X', 'ULTRASSOM', 'TOMOGRAFIA', 'RESSONANCIA', 'BIOPSIA',
  'OUTRO',
] as const;

export class ImportExamDto {
  @ApiProperty() @IsString() patientId: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() professionalId?: string;
  @ApiProperty({ enum: ExamTypes }) @IsString() examType: string;
  @ApiProperty() @IsString() labName: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() examDate?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() notes?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() fileUrl?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() fileName?: string;
}
