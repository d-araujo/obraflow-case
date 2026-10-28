import { describe, expect, it } from 'vitest';
import type { Faixa } from '../../api/tipos';
import {
  paraSalvarFaixa,
  validarFaixa,
  valoresDaFaixa,
} from './formulario-faixa';

describe('validarFaixa', () => {
  it('exige limite positivo quando a faixa tem teto', () => {
    expect(
      validarFaixa({ semTeto: false, limite: 0, aprovadorIds: [1] }).limite,
    ).toBe('Informe um limite maior que zero.');
    expect(
      validarFaixa({ semTeto: false, limite: '', aprovadorIds: [1] }).limite,
    ).toBeDefined();
  });

  it('ignora o limite na faixa sem teto', () => {
    expect(
      validarFaixa({ semTeto: true, limite: '', aprovadorIds: [1] }),
    ).toEqual({});
  });

  it('exige pelo menos um aprovador', () => {
    expect(
      validarFaixa({ semTeto: true, limite: '', aprovadorIds: [] })
        .aprovadorIds,
    ).toBe('Adicione pelo menos um aprovador.');
  });
});

describe('conversões', () => {
  const faixa: Faixa = {
    id: 3,
    obraId: 1,
    limiteMaximo: '10000.00',
    aprovadores: [
      { ordem: 1, usuario: { id: 2, nome: 'Bruno' } },
      { ordem: 2, usuario: { id: 1, nome: 'Ana' } },
    ],
  };

  it('carrega a faixa existente mantendo a ordem dos aprovadores', () => {
    expect(valoresDaFaixa(faixa)).toEqual({
      semTeto: false,
      limite: '10000.00',
      aprovadorIds: [2, 1],
    });
  });

  it('envia o limite com 2 casas ou null para sem teto', () => {
    expect(
      paraSalvarFaixa({ semTeto: false, limite: 12500.5, aprovadorIds: [1] }),
    ).toEqual({ limiteMaximo: '12500.50', aprovadorIds: [1] });
    expect(
      paraSalvarFaixa({ semTeto: true, limite: 99, aprovadorIds: [1] }),
    ).toEqual({ limiteMaximo: null, aprovadorIds: [1] });
  });
});
