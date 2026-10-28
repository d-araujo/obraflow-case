import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { aparar } from '../../comum/validacao.js';

export class RejeitarPedidoDto {
  @ApiProperty({ example: 'Preço acima da cotação aprovada.' })
  @Transform(aparar)
  @IsString({ message: 'O motivo deve ser um texto.' })
  @IsNotEmpty({ message: 'Informe o motivo da rejeição.' })
  @MaxLength(500, { message: 'O motivo deve ter no máximo 500 caracteres.' })
  motivo: string;
}
