import { IsOptional, IsString, IsBoolean, IsInt } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMedicalHistoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  allergies?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  chronicDiseases?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currentMedications?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pastSurgeries?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  familyHistory?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dentalHistory?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  smokingAlcohol?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  pregnancy?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  pregnancyMonth?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialConditions?: string;
}
