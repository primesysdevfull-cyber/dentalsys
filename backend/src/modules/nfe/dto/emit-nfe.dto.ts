import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class EmitNfeDto {
  @ApiProperty()
  @IsString()
  transactionId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  provider?: string;
}
