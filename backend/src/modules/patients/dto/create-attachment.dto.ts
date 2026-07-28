import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAttachmentDto {
  @ApiProperty({ enum: ['XRAY', 'PHOTO', 'DOCUMENT', 'LAB_RESULT', 'CONSENT', 'OTHER'] })
  @IsEnum(['XRAY', 'PHOTO', 'DOCUMENT', 'LAB_RESULT', 'CONSENT', 'OTHER'] as const)
  type: string;

  @ApiProperty({ example: 'Radiografia panorâmica' })
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'https://storage.example.com/files/xray-001.jpg' })
  @IsString()
  fileUrl: string;

  @ApiProperty({ example: 'radiografia-panoramica.jpg' })
  @IsString()
  fileName: string;

  @ApiPropertyOptional()
  @IsOptional()
  fileSize?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mimeType?: string;
}
