import { ApiProperty } from '@nestjs/swagger';
import { ReferenciaResposta } from '../comum/referencia.resposta.js';

class EtapaPreviaResposta {
  @ApiProperty({ example: 1 })
  ordem: number;

  @ApiProperty({ type: ReferenciaResposta })
  aprovador: ReferenciaResposta;
}

export class PreviaCadeiaResposta {
  @ApiProperty({ description: 'false quando nenhuma faixa cobre o total.' })
  aplicavel: boolean;

  @ApiProperty({ type: [EtapaPreviaResposta] })
  etapas: EtapaPreviaResposta[];

  @ApiProperty({
    type: String,
    nullable: true,
    enum: ['OBRA_SEM_FAIXAS', 'ACIMA_DO_MAIOR_LIMITE'],
  })
  motivo: 'OBRA_SEM_FAIXAS' | 'ACIMA_DO_MAIOR_LIMITE' | null;

  @ApiProperty({ type: String, nullable: true })
  mensagem: string | null;
}
