import { IsArray, ValidateNested, IsString, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class ToothDto {
  @ApiProperty({ example: 11 })
  @IsNumber()
  toothNumber: number;

  @ApiProperty({ enum: ['HEALTHY', 'CARIES', 'RESTORATION', 'CROWN', 'BRIDGE', 'IMPLANT', 'EXTRACTION', 'MISSING', 'FRACTURE', 'SENSITIVITY', 'ENDODONTICS', 'PROSTHESIS', 'OTHER'] })
  @IsString()
  condition: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  surface?: string;
}

export class UpdateOdontogramDto {
  @ApiProperty({ type: [ToothDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ToothDto)
  teeth: ToothDto[];
}
