import { Decimal } from 'decimal.js';
import { formatarReais } from '../comum/dinheiro.js';

export interface FaixaDaRegra {
  limiteMaximo: Decimal.Value | null;
  aprovadores: { usuarioId: number; ordem: number }[];
}

export interface EtapaDaCadeia {
  ordem: number;
  aprovadorId: number;
}

export type ResultadoCadeia =
  | { aplicavel: true; etapas: EtapaDaCadeia[] }
  | { aplicavel: false; motivo: 'OBRA_SEM_FAIXAS' }
  | { aplicavel: false; motivo: 'ACIMA_DO_MAIOR_LIMITE'; maiorLimite: Decimal };

export function montarCadeia(
  faixas: FaixaDaRegra[],
  total: Decimal.Value,
): ResultadoCadeia {
  if (faixas.length === 0) {
    return { aplicavel: false, motivo: 'OBRA_SEM_FAIXAS' };
  }

  const valor = new Decimal(total);
  const ordenadas = [...faixas].sort(porLimiteCrescente);
  const indiceDaFaixa = ordenadas.findIndex(
    (faixa) => faixa.limiteMaximo === null || valor.lte(faixa.limiteMaximo),
  );
  if (indiceDaFaixa === -1) {
    // Se houvesse faixa sem teto ela teria casado, então a última ordenada tem o maior limite.
    const { limiteMaximo } = ordenadas[ordenadas.length - 1];
    return {
      aplicavel: false,
      motivo: 'ACIMA_DO_MAIOR_LIMITE',
      maiorLimite: new Decimal(limiteMaximo as Decimal.Value),
    };
  }

  // Modelo cumulativo: o pedido passa por todas as faixas até a sua, da menor para a maior.
  const jaNaCadeia = new Set<number>();
  const etapas: EtapaDaCadeia[] = [];
  for (const faixa of ordenadas.slice(0, indiceDaFaixa + 1)) {
    const aprovadores = [...faixa.aprovadores].sort(
      (a, b) => a.ordem - b.ordem,
    );
    for (const { usuarioId } of aprovadores) {
      if (jaNaCadeia.has(usuarioId)) continue;
      jaNaCadeia.add(usuarioId);
      etapas.push({ ordem: etapas.length + 1, aprovadorId: usuarioId });
    }
  }
  return { aplicavel: true, etapas };
}

export function descreverFaltaDeFaixa(
  resultado: Extract<ResultadoCadeia, { aplicavel: false }>,
  nomeObra: string,
  total: Decimal.Value,
): string {
  if (resultado.motivo === 'OBRA_SEM_FAIXAS') {
    return `A obra "${nomeObra}" não tem faixas de alçada. Configure as regras antes de criar pedidos.`;
  }
  return (
    `O total de ${formatarReais(total)} ultrapassa o maior limite da obra "${nomeObra}" ` +
    `(${formatarReais(resultado.maiorLimite)}) e não há faixa sem teto. Ajuste as regras de alçada.`
  );
}

function porLimiteCrescente(a: FaixaDaRegra, b: FaixaDaRegra): number {
  if (a.limiteMaximo === null) return b.limiteMaximo === null ? 0 : 1;
  if (b.limiteMaximo === null) return -1;
  return new Decimal(a.limiteMaximo).comparedTo(b.limiteMaximo);
}
