import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({ example: 'Consultório 1' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  number?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
