import { Decimal } from 'decimal.js';
import { describe, expect, it } from 'vitest';
import {
  calcularTotalItem,
  formatarQuantidade,
  formatarReais,
  paraDecimal,
  somar,
} from './dinheiro';

describe('calcularTotalItem', () => {
  it('arredonda half-up como o back', () => {
    expect(calcularTotalItem('2.5', '0.15')?.toFixed(2)).toBe('0.38');
    expect(calcularTotalItem(0.333, 10)?.toFixed(2)).toBe('3.33');
  });

  it('não tem erro de ponto flutuante', () => {
    expect(calcularTotalItem(3, 0.1)?.toFixed(2)).toBe('0.30');
  });

  it('devolve null enquanto o campo está vazio', () => {
    expect(calcularTotalItem('', '10')).toBeNull();
    expect(calcularTotalItem('2', '')).toBeNull();
  });
});

describe('paraDecimal', () => {
  it('rejeita texto que não é número', () => {
    expect(paraDecimal('abc')).toBeNull();
    expect(paraDecimal('12')?.toFixed()).toBe('12');
  });
});

describe('somar', () => {
  it('soma sem perder centavos', () => {
    expect(somar([new Decimal('0.1'), new Decimal('0.2')]).toFixed(2)).toBe(
      '0.30',
    );
  });
});

describe('formatação pt-BR', () => {
  it('formata reais com separador de milhar e vírgula', () => {
    expect(formatarReais('1234567.8').replace(/\s/g, ' ')).toBe(
      'R$ 1.234.567,80',
    );
  });

  it('formata quantidade com até 3 casas', () => {
    expect(formatarQuantidade('1200')).toBe('1.200');
    expect(formatarQuantidade('2.5')).toBe('2,5');
  });
});
