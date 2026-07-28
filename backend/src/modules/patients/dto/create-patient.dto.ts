import { IsString, IsOptional, IsEmail, IsEnum, IsDateString, IsArray, ValidateNested, IsPhoneNumber, IsBoolean, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class MedicalHistoryDto {
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

class GuardianDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cpf?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty()
  @IsString()
  relation: string;

  @ApiPropertyOptional()
  @IsOptional()
  isPrimary?: boolean;
}

export class CreatePatientDto {
  @ApiProperty({ example: 'João da Silva' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '123.456.789-00' })
  @IsOptional()
  @IsString()
  cpf?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rg?: string;

  @ApiPropertyOptional({ example: '1990-05-15' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({ enum: ['MALE', 'FEMALE', 'OTHER'] })
  @IsOptional()
  @IsEnum(['MALE', 'FEMALE', 'OTHER'] as const)
  gender?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '(11) 99999-9999' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  whatsapp?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  // Convênio
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  insuranceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  insuranceNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  insuranceValidUntil?: string;

  // Contato de emergência
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  emergencyContactRelation?: string;

  // Responsável legal
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  legalGuardianName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  legalGuardianCpf?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  legalGuardianPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  legalGuardianRelation?: string;

  // Relacionados
  @ApiPropertyOptional({ type: MedicalHistoryDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MedicalHistoryDto)
  medicalHistory?: MedicalHistoryDto;

  @ApiPropertyOptional({ type: [GuardianDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuardianDto)
  guardians?: GuardianDto[];
}
