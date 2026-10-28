import { describe, expect, it } from 'vitest';
import type { Faixa } from '../api/tipos';
import { rotuloDaFaixa } from './faixas';

function faixa(limiteMaximo: string | null): Faixa {
  return { id: 1, obraId: 1, limiteMaximo, aprovadores: [] };
}

const normalizar = (texto: string) => texto.replace(/\s/g, ' ');

describe('rotuloDaFaixa', () => {
  const faixas = [faixa('5000.00'), faixa('50000.00'), faixa(null)];

  it('descreve a primeira, as intermediárias e a sem teto', () => {
    expect(normalizar(rotuloDaFaixa(faixas, 0))).toBe('Até R$ 5.000,00');
    expect(normalizar(rotuloDaFaixa(faixas, 1))).toBe(
      'Acima de R$ 5.000,00 até R$ 50.000,00',
    );
    expect(normalizar(rotuloDaFaixa(faixas, 2))).toBe('Acima de R$ 50.000,00');
  });

  it('faixa sem teto sozinha cobre qualquer valor', () => {
    expect(rotuloDaFaixa([faixa(null)], 0)).toBe('Qualquer valor');
  });
});
