import { Decimal } from 'decimal.js';

// Maior valor que cabe em Decimal(14, 2), o tipo das colunas de total.
export const TOTAL_MAXIMO = new Decimal('999999999999.99');

// Half-up é o arredondamento comercial; o front usa o mesmo para a prévia bater com o back.
export function calcularTotalItem(
  quantidade: Decimal.Value,
  precoUnitario: Decimal.Value,
): Decimal {
  return new Decimal(quantidade)
    .times(precoUnitario)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

export function somar(valores: Decimal[]): Decimal {
  return valores.reduce((soma, valor) => soma.plus(valor), new Decimal(0));
}

export function formatarReais(valor: Decimal.Value): string {
  const [inteiro, centavos] = new Decimal(valor).toFixed(2).split('.');
  return `R$ ${inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${centavos}`;
}
