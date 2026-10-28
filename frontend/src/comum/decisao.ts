import type { Etapa, PedidoResumo } from '../api/tipos';

export function etapaDaVez(pedido: PedidoResumo): Etapa | null {
  return pedido.etapas.find((e) => e.ordem === pedido.etapaAtual) ?? null;
}

// Espelha as regras do back só para explicar o botão desabilitado; quem decide de fato é a API.
export function motivoDeBloqueio(
  pedido: PedidoResumo,
  usuarioId: number | null,
): string | null {
  if (pedido.status === 'APROVADO') return 'Fluxo concluído: pedido aprovado.';
  if (pedido.status === 'REJEITADO') {
    return 'Fluxo concluído: pedido rejeitado.';
  }

  const etapa = etapaDaVez(pedido);
  if (!etapa) return 'Fluxo concluído.';
  if (usuarioId === null) {
    return `Aguardando ${etapa.aprovador.nome}. Escolha quem está agindo no topo.`;
  }
  if (etapa.aprovador.id !== usuarioId) {
    return `Aguardando ${etapa.aprovador.nome}.`;
  }
  return null;
}
