import { Decimal } from 'decimal.js';

export type ValorDigitado = number | string;

const reais = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const quantidade = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 3,
});

export function paraDecimal(valor: ValorDigitado): Decimal | null {
  if (valor === '') return null;
  try {
    const decimal = new Decimal(valor);
    return decimal.isFinite() ? decimal : null;
  } catch {
    return null;
  }
}

// Mesmo arredondamento do back (half-up), para a prévia mostrar exatamente o total que será gravado.
export function calcularTotalItem(
  quantidade: ValorDigitado,
  precoUnitario: ValorDigitado,
): Decimal | null {
  const q = paraDecimal(quantidade);
  const p = paraDecimal(precoUnitario);
  if (!q || !p) return null;
  return q.times(p).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

export function somar(valores: Decimal[]): Decimal {
  return valores.reduce((soma, valor) => soma.plus(valor), new Decimal(0));
}

export function formatarReais(valor: Decimal.Value): string {
  return reais.format(new Decimal(valor).toFixed(2) as `${number}`);
}

export function formatarQuantidade(valor: Decimal.Value): string {
  return quantidade.format(new Decimal(valor).toFixed() as `${number}`);
}
