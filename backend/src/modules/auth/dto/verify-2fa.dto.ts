import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Verify2faDto {
  @ApiProperty({ example: '123456', description: 'Código de 6 dígitos do app autenticador' })
  @IsString()
  @Length(6, 6)
  code: string;
}
