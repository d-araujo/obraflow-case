import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  ValidateIf,
} from 'class-validator';
import { IsDecimalTexto } from '../../comum/validacao.js';

export class SalvarFaixaDto {
  @ApiProperty({
    type: String,
    nullable: true,
    example: '10000.00',
    description:
      'Limite superior da faixa, inclusivo ("até X"). null = faixa sem teto.',
  })
  @ValidateIf((_, valor) => valor !== null)
  @IsDecimalTexto(
    { inteiros: 12, casas: 2, permiteZero: false },
    'O limite deve ser um valor maior que zero com até 2 casas decimais (ex.: "10000.00"), ou null para faixa sem teto.',
  )
  limiteMaximo: string | null;

  @ApiProperty({
    type: [Number],
    example: [1, 2],
    description: 'Ids dos aprovadores, na ordem do fluxo.',
  })
  @IsArray({ message: 'Informe os aprovadores em uma lista.' })
  @ArrayMinSize(1, { message: 'A faixa precisa de pelo menos um aprovador.' })
  @ArrayMaxSize(20, { message: 'A faixa aceita no máximo 20 aprovadores.' })
  @ArrayUnique({
    message: 'O mesmo aprovador não pode aparecer duas vezes na faixa.',
  })
  @IsInt({ each: true, message: 'Os aprovadores devem ser ids inteiros.' })
  aprovadorIds: number[];
}
