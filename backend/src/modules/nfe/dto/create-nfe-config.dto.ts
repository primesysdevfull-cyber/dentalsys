import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';

export class CreateNfeConfigDto {
  @ApiProperty({ enum: ['BLING', 'TINY'] })
  @IsEnum(['BLING', 'TINY'])
  provider: string;

  @ApiProperty()
  @IsString()
  apiKey: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  apiUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  seriesNumber?: string;

  @ApiProperty({ required: false, default: 'production' })
  @IsOptional()
  @IsString()
  environment?: string;
}

export class UpdateNfeConfigDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  apiUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  seriesNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  environment?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
