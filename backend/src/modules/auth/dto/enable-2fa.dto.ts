import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Enable2faDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  code: string;
}
