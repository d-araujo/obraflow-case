import { Decimal } from 'decimal.js';
import { calcularTotalItem, formatarReais, somar } from './dinheiro.js';

describe('calcularTotalItem', () => {
  it('arredonda para 2 casas com half-up', () => {
    expect(calcularTotalItem('2.5', '0.15').toFixed(2)).toBe('0.38');
    expect(calcularTotalItem('0.333', '10.00').toFixed(2)).toBe('3.33');
  });

  it('não sofre do erro de ponto flutuante', () => {
    expect(calcularTotalItem('3', '0.10').toFixed(2)).toBe('0.30');
    expect(0.1 * 3).not.toBe(0.3);
  });
});

describe('somar', () => {
  it('soma valores decimais exatamente', () => {
    const total = somar([new Decimal('0.10'), new Decimal('0.20')]);
    expect(total.toFixed(2)).toBe('0.30');
  });

  it('lista vazia soma zero', () => {
    expect(somar([]).toFixed(2)).toBe('0.00');
  });
});

describe('formatarReais', () => {
  it('formata no padrão brasileiro', () => {
    expect(formatarReais('1234567.8')).toBe('R$ 1.234.567,80');
    expect(formatarReais('0')).toBe('R$ 0,00');
  });
});
