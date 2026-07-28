import { IsString, IsEmail, IsEnum, IsOptional, MinLength, Matches, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'Maria Santos' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'maria@clinica.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Senha@123' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
    message: 'Senha deve conter: 1 maiúscula, 1 minúscula, 1 número e 1 especial',
  })
  password: string;

  @ApiProperty({ enum: ['ADMIN', 'DENTIST', 'ASSISTANT', 'RECEPTIONIST', 'FINANCIAL'] })
  @IsEnum(['ADMIN', 'DENTIST', 'ASSISTANT', 'RECEPTIONIST', 'FINANCIAL'] as const)
  role: string;

  @ApiPropertyOptional({ example: '(11) 99999-9999' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 8, description: 'Máximo de consultas por dia (apenas para dentistas)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxAppointmentsPerDay?: number;
}
