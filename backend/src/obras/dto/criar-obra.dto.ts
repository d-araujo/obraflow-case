import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { aparar } from '../../comum/validacao.js';

export class CriarObraDto {
  @ApiProperty({ example: 'Residencial Aurora' })
  @Transform(aparar)
  @IsString({ message: 'O nome da obra deve ser um texto.' })
  @IsNotEmpty({ message: 'Informe o nome da obra.' })
  @MaxLength(120, {
    message: 'O nome da obra deve ter no máximo 120 caracteres.',
  })
  nome: string;
}
