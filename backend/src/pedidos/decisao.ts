import { HttpStatus } from '@nestjs/common';
import { ErroApi } from '../comum/erro-api.js';
import { StatusEtapa, StatusPedido } from '../generated/prisma/enums.js';

export type Decisao =
  { tipo: 'aprovar' } | { tipo: 'rejeitar'; motivo: string };

export interface PedidoEmDecisao {
  id: number;
  status: StatusPedido;
  etapaAtual: number | null;
  etapas: {
    id: number;
    ordem: number;
    aprovadorId: number;
    aprovador: { nome: string };
  }[];
}

export interface PlanoDecisao {
  etapa: {
    id: number;
    ordem: number;
    status: StatusEtapa;
    motivo: string | null;
  };
  pedido: { status: StatusPedido; etapaAtual: number | null };
  cancelarEtapasApos: number | null;
}

export function planejarDecisao(
  pedido: PedidoEmDecisao,
  usuarioId: number,
  decisao: Decisao,
): PlanoDecisao {
  if (pedido.status !== StatusPedido.PENDENTE || pedido.etapaAtual === null) {
    const desfecho =
      pedido.status === StatusPedido.APROVADO ? 'aprovado' : 'rejeitado';
    throw new ErroApi(
      HttpStatus.CONFLICT,
      'FLUXO_CONCLUIDO',
      `O pedido #${pedido.id} já foi ${desfecho}; não há decisão pendente.`,
    );
  }

  const atual = pedido.etapas.find(
    (etapa) => etapa.ordem === pedido.etapaAtual,
  );
  if (!atual) {
    throw new Error(
      `Pedido #${pedido.id} aponta para a etapa ${pedido.etapaAtual}, que não existe.`,
    );
  }
  if (atual.aprovadorId !== usuarioId) {
    throw new ErroApi(
      HttpStatus.FORBIDDEN,
      'FORA_DA_VEZ',
      `A etapa ${atual.ordem} do pedido #${pedido.id} aguarda a decisão de ${atual.aprovador.nome}.`,
    );
  }

  if (decisao.tipo === 'rejeitar') {
    const motivo = decisao.motivo.trim();
    if (!motivo) {
      throw new ErroApi(
        HttpStatus.BAD_REQUEST,
        'MOTIVO_OBRIGATORIO',
        'Informe o motivo da rejeição.',
      );
    }
    return {
      etapa: {
        id: atual.id,
        ordem: atual.ordem,
        status: StatusEtapa.REJEITADA,
        motivo,
      },
      pedido: { status: StatusPedido.REJEITADO, etapaAtual: null },
      cancelarEtapasApos: atual.ordem,
    };
  }

  const ultima = pedido.etapas.every((etapa) => etapa.ordem <= atual.ordem);
  return {
    etapa: {
      id: atual.id,
      ordem: atual.ordem,
      status: StatusEtapa.APROVADA,
      motivo: null,
    },
    pedido: ultima
      ? { status: StatusPedido.APROVADO, etapaAtual: null }
      : { status: StatusPedido.PENDENTE, etapaAtual: atual.ordem + 1 },
    cancelarEtapasApos: null,
  };
}
