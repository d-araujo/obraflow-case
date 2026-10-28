import { ApiProperty } from '@nestjs/swagger';
import { ReferenciaResposta } from '../comum/referencia.resposta.js';
import {
  StatusEtapa,
  StatusPedido,
  Unidade,
} from '../generated/prisma/enums.js';

export class EtapaResposta {
  @ApiProperty({ example: 1 })
  ordem: number;

  @ApiProperty({ type: ReferenciaResposta })
  aprovador: ReferenciaResposta;

  @ApiProperty({ enum: StatusEtapa })
  status: StatusEtapa;

  @ApiProperty({ type: String, nullable: true })
  motivo: string | null;

  @ApiProperty({ type: Date, nullable: true })
  decididaEm: Date | null;
}

export class ItemResposta {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Cimento CP-II 50 kg' })
  descricao: string;

  @ApiProperty({ example: '120' })
  quantidade: string;

  @ApiProperty({ enum: Unidade })
  unidade: Unidade;

  @ApiProperty({ example: '38.90' })
  precoUnitario: string;

  @ApiProperty({ example: '4668.00' })
  total: string;
}

export class PedidoResumoResposta {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ type: ReferenciaResposta })
  obra: ReferenciaResposta;

  @ApiProperty({ type: ReferenciaResposta })
  fornecedor: ReferenciaResposta;

  @ApiProperty({ example: '2026-10-28' })
  dataPedido: string;

  @ApiProperty({ example: 3 })
  quantidadeItens: number;

  @ApiProperty({ example: '12500.00' })
  total: string;

  @ApiProperty({ enum: StatusPedido })
  status: StatusPedido;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Ordem da etapa da vez; null quando o fluxo terminou.',
  })
  etapaAtual: number | null;

  @ApiProperty({ type: [EtapaResposta] })
  etapas: EtapaResposta[];
}

export class PedidoDetalheResposta extends PedidoResumoResposta {
  @ApiProperty({ type: String, nullable: true })
  observacoes: string | null;

  @ApiProperty()
  criadoEm: Date;

  @ApiProperty({ type: [ItemResposta] })
  itens: ItemResposta[];
}
