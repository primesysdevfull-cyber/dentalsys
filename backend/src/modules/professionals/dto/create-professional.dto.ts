import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber, IsEmail, Min, Max, IsInt, MinLength } from 'class-validator';

export class CreateProfessionalDto {
  @ApiProperty({ example: 'Dr. Carlos Silva' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'CRO-SP 12345' })
  @IsOptional()
  @IsString()
  croNumber?: string;

  @ApiPropertyOptional({ example: 'Clínica Geral' })
  @IsOptional()
  @IsString()
  specialty?: string;

  @ApiPropertyOptional({ example: '#3B82F6' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 40, description: 'Percentual de comissão (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate?: number;

  @ApiPropertyOptional({ example: { mon: '08:00-17:00', tue: '08:00-17:00' } })
  @IsOptional()
  workingHours?: Record<string, string>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ example: 'profissional@email.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '(11) 99999-9999' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Rua Exemplo, 123' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 10, description: 'Máximo de pacientes por dia' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxAppointmentsPerDay?: number;
}
