import { ErroApi } from '../comum/erro-api.js';
import { StatusPedido } from '../generated/prisma/enums.js';
import { PedidoEmDecisao, planejarDecisao } from './decisao.js';

const ANA = 1;
const BRUNO = 2;
const CARLA = 3;

function pedido(sobrescrever: Partial<PedidoEmDecisao> = {}): PedidoEmDecisao {
  return {
    id: 7,
    status: StatusPedido.PENDENTE,
    etapaAtual: 1,
    etapas: [
      { id: 71, ordem: 1, aprovadorId: ANA, aprovador: { nome: 'Ana' } },
      { id: 72, ordem: 2, aprovadorId: BRUNO, aprovador: { nome: 'Bruno' } },
      { id: 73, ordem: 3, aprovadorId: CARLA, aprovador: { nome: 'Carla' } },
    ],
    ...sobrescrever,
  };
}

function erroDe(acao: () => unknown): ErroApi {
  try {
    acao();
  } catch (erro) {
    if (erro instanceof ErroApi) return erro;
    throw erro;
  }
  throw new Error('era esperado um ErroApi');
}

describe('planejarDecisao', () => {
  describe('fora de ordem', () => {
    it('recusa com 403 quem não é o aprovador da etapa atual', () => {
      const erro = erroDe(() =>
        planejarDecisao(pedido(), BRUNO, { tipo: 'aprovar' }),
      );

      expect(erro.getStatus()).toBe(403);
      expect(erro.codigo).toBe('FORA_DA_VEZ');
      expect(erro.message).toContain('aguarda a decisão de Ana');
    });

    it('recusa também a rejeição fora da vez', () => {
      const erro = erroDe(() =>
        planejarDecisao(pedido({ etapaAtual: 2 }), CARLA, {
          tipo: 'rejeitar',
          motivo: 'Caro demais',
        }),
      );

      expect(erro.codigo).toBe('FORA_DA_VEZ');
    });

    it('recusa quem já aprovou uma etapa anterior', () => {
      const erro = erroDe(() =>
        planejarDecisao(pedido({ etapaAtual: 2 }), ANA, { tipo: 'aprovar' }),
      );

      expect(erro.codigo).toBe('FORA_DA_VEZ');
    });
  });

  describe('rejeição sem motivo', () => {
    it.each(['', '   '])('recusa com 400 o motivo "%s"', (motivo) => {
      const erro = erroDe(() =>
        planejarDecisao(pedido(), ANA, { tipo: 'rejeitar', motivo }),
      );

      expect(erro.getStatus()).toBe(400);
      expect(erro.codigo).toBe('MOTIVO_OBRIGATORIO');
    });
  });

  describe('pedido concluído', () => {
    it('recusa com 409 decisão em pedido aprovado', () => {
      const erro = erroDe(() =>
        planejarDecisao(
          pedido({ status: StatusPedido.APROVADO, etapaAtual: null }),
          CARLA,
          { tipo: 'aprovar' },
        ),
      );

      expect(erro.getStatus()).toBe(409);
      expect(erro.codigo).toBe('FLUXO_CONCLUIDO');
      expect(erro.message).toContain('já foi aprovado');
    });

    it('recusa com 409 decisão em pedido rejeitado', () => {
      const erro = erroDe(() =>
        planejarDecisao(
          pedido({ status: StatusPedido.REJEITADO, etapaAtual: null }),
          ANA,
          { tipo: 'rejeitar', motivo: 'de novo' },
        ),
      );

      expect(erro.codigo).toBe('FLUXO_CONCLUIDO');
      expect(erro.message).toContain('já foi rejeitado');
    });
  });

  describe('decisões válidas', () => {
    it('aprovar etapa intermediária avança para a próxima', () => {
      const plano = planejarDecisao(pedido(), ANA, { tipo: 'aprovar' });

      expect(plano).toEqual({
        etapa: { id: 71, ordem: 1, status: 'APROVADA', motivo: null },
        pedido: { status: 'PENDENTE', etapaAtual: 2 },
        cancelarEtapasApos: null,
      });
    });

    it('aprovar a última etapa aprova o pedido e encerra o fluxo', () => {
      const plano = planejarDecisao(pedido({ etapaAtual: 3 }), CARLA, {
        tipo: 'aprovar',
      });

      expect(plano.pedido).toEqual({ status: 'APROVADO', etapaAtual: null });
    });

    it('rejeitar encerra o fluxo, guarda o motivo e cancela as etapas seguintes', () => {
      const plano = planejarDecisao(pedido({ etapaAtual: 2 }), BRUNO, {
        tipo: 'rejeitar',
        motivo: '  Fornecedor sem cadastro  ',
      });

      expect(plano).toEqual({
        etapa: {
          id: 72,
          ordem: 2,
          status: 'REJEITADA',
          motivo: 'Fornecedor sem cadastro',
        },
        pedido: { status: 'REJEITADO', etapaAtual: null },
        cancelarEtapasApos: 2,
      });
    });
  });
});
