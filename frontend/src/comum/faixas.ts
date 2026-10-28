import type { Faixa } from '../api/tipos';
import { formatarReais } from './dinheiro';

// Espera as faixas na ordem da API: limite crescente e a sem teto por último.
export function rotuloDaFaixa(faixas: Faixa[], indice: number): string {
  const limite = faixas[indice].limiteMaximo;
  const anterior = indice > 0 ? faixas[indice - 1].limiteMaximo : null;

  if (limite === null) {
    return anterior === null
      ? 'Qualquer valor'
      : `Acima de ${formatarReais(anterior)}`;
  }
  return anterior === null
    ? `Até ${formatarReais(limite)}`
    : `Acima de ${formatarReais(anterior)} até ${formatarReais(limite)}`;
}
