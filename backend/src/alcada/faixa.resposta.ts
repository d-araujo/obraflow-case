import { ApiProperty } from '@nestjs/swagger';
import { ReferenciaResposta } from '../comum/referencia.resposta.js';

class AprovadorDaFaixaResposta {
  @ApiProperty({ example: 1 })
  ordem: number;

  @ApiProperty({ type: ReferenciaResposta })
  usuario: ReferenciaResposta;
}

export class FaixaResposta {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  obraId: number;

  @ApiProperty({
    type: String,
    nullable: true,
    example: '10000.00',
    description: 'Limite inclusivo; null = sem teto.',
  })
  limiteMaximo: string | null;

  @ApiProperty({ type: [AprovadorDaFaixaResposta] })
  aprovadores: AprovadorDaFaixaResposta[];
}
