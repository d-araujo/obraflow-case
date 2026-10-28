import { describe, expect, it } from 'vitest';
import type { PedidoResumo } from '../api/tipos';
import { motivoDeBloqueio } from './decisao';

const ANA = { id: 1, nome: 'Ana' };
const BRUNO = { id: 2, nome: 'Bruno' };

function pedido(sobrescrever: Partial<PedidoResumo> = {}): PedidoResumo {
  return {
    id: 1,
    obra: { id: 1, nome: 'Obra' },
    fornecedor: { id: 1, nome: 'Fornecedor' },
    dataPedido: '2026-10-28',
    quantidadeItens: 1,
    total: '100.00',
    status: 'PENDENTE',
    etapaAtual: 2,
    etapas: [
      {
        ordem: 1,
        aprovador: ANA,
        status: 'APROVADA',
        motivo: null,
        decididaEm: null,
      },
      {
        ordem: 2,
        aprovador: BRUNO,
        status: 'PENDENTE',
        motivo: null,
        decididaEm: null,
      },
    ],
    ...sobrescrever,
  };
}

describe('motivoDeBloqueio', () => {
  it('libera a decisão para o aprovador da vez', () => {
    expect(motivoDeBloqueio(pedido(), BRUNO.id)).toBeNull();
  });

  it('explica quem está sendo aguardado', () => {
    expect(motivoDeBloqueio(pedido(), ANA.id)).toBe('Aguardando Bruno.');
  });

  it('pede para escolher quem está agindo', () => {
    expect(motivoDeBloqueio(pedido(), null)).toContain('Aguardando Bruno');
  });

  it('informa fluxo concluído', () => {
    expect(
      motivoDeBloqueio(
        pedido({ status: 'APROVADO', etapaAtual: null }),
        BRUNO.id,
      ),
    ).toBe('Fluxo concluído: pedido aprovado.');
    expect(
      motivoDeBloqueio(
        pedido({ status: 'REJEITADO', etapaAtual: null }),
        BRUNO.id,
      ),
    ).toBe('Fluxo concluído: pedido rejeitado.');
  });
});
