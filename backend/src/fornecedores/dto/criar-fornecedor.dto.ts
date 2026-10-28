import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { aparar } from '../../comum/validacao.js';

export class CriarFornecedorDto {
  @ApiProperty({ example: 'Cimentos Bahia Ltda.' })
  @Transform(aparar)
  @IsString({ message: 'O nome deve ser um texto.' })
  @IsNotEmpty({ message: 'Informe o nome do fornecedor.' })
  @MaxLength(120, { message: 'O nome deve ter no máximo 120 caracteres.' })
  nome: string;

  @ApiPropertyOptional({ example: '12.345.678/0001-90' })
  @Transform(aparar)
  @IsOptional()
  @Matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, {
    message: 'O CNPJ deve estar no formato 00.000.000/0000-00.',
  })
  cnpj?: string;
}
