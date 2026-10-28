import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { aparar } from '../../comum/validacao.js';

export class CriarUsuarioDto {
  @ApiProperty({ example: 'Ana Souza' })
  @Transform(aparar)
  @IsString({ message: 'O nome deve ser um texto.' })
  @IsNotEmpty({ message: 'Informe o nome do usuário.' })
  @MaxLength(120, { message: 'O nome deve ter no máximo 120 caracteres.' })
  nome: string;

  @ApiProperty({ example: 'ana@obraflow.dev' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  email: string;
}
