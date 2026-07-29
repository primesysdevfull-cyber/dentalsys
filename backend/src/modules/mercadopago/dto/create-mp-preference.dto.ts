import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMpPreferenceDto {
  @ApiProperty({ example: 'uuid-patient-id' })
  @IsString()
  patientId: string;

  @ApiProperty({ example: 15000 })
  @IsNumber()
  @Min(100)
  amount: number;

  @ApiProperty({ example: 'Consulta Odontológica' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ example: 'paciente@email.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: '123.456.789-00' })
  @IsOptional()
  @IsString()
  cpf?: string;
}
