import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMovementDto {
  @ApiProperty({ enum: ['ENTRY', 'EXIT', 'ADJUSTMENT', 'RETURN'] })
  @IsEnum(['ENTRY', 'EXIT', 'ADJUSTMENT', 'RETURN'] as const)
  type: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  unitCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  totalCost?: number;

  @ApiPropertyOptional({ example: 'Reposição de estoque' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  invoiceNumber?: string;
}
