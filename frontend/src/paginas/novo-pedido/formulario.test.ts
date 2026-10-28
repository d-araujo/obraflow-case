import { describe, expect, it } from 'vitest';
import {
  itemVazio,
  paraNovoPedido,
  resumirPendencias,
  totalDoPedido,
  validarPedido,
  valoresIniciais,
  type ValoresPedido,
} from './formulario';

function preenchido(): ValoresPedido {
  return {
    obraId: 1,
    fornecedorId: 2,
    dataPedido: '2026-10-28',
    observacoes: '  urgente ',
    itens: [
      {
        ...itemVazio(),
        descricao: ' Cimento ',
        quantidade: 2.5,
        precoUnitario: 0.15,
      },
      {
        ...itemVazio(),
        descricao: 'Areia',
        quantidade: 3,
        unidade: 'M3',
        precoUnitario: '100.1',
      },
    ],
  };
}

describe('validarPedido', () => {
  it('aceita um pedido completo', () => {
    expect(validarPedido(preenchido())).toEqual({});
  });

  it('aponta os campos obrigatórios do cabeçalho e da linha em branco', () => {
    const erros = validarPedido(valoresIniciais('2026-10-28'));

    expect(Object.keys(erros).sort()).toEqual([
      'fornecedorId',
      'itens.0.descricao',
      'itens.0.precoUnitario',
      'itens.0.quantidade',
      'obraId',
    ]);
  });

  it('recusa quantidade zero ou negativa e preço negativo no item certo', () => {
    const valores = preenchido();
    valores.itens[1].quantidade = 0;
    valores.itens[1].precoUnitario = -1;

    expect(validarPedido(valores)).toEqual({
      'itens.1.quantidade': 'Informe uma quantidade maior que zero.',
      'itens.1.precoUnitario': 'Informe um preço igual ou maior que zero.',
    });
  });

  it('recusa valor não numérico', () => {
    const valores = preenchido();
    valores.itens[0].quantidade = 'abc';

    expect(validarPedido(valores)['itens.0.quantidade']).toBeDefined();
  });

  it('exige pelo menos um item', () => {
    expect(validarPedido({ ...preenchido(), itens: [] }).itens).toBe(
      'O pedido precisa de pelo menos um item.',
    );
  });
});

describe('resumirPendencias', () => {
  it('resume o que falta para habilitar o envio', () => {
    expect(
      resumirPendencias(validarPedido(valoresIniciais('2026-10-28'))),
    ).toEqual([
      'selecione a obra',
      'selecione o fornecedor',
      'complete 1 item',
    ]);
    expect(resumirPendencias({})).toEqual([]);
  });
});

describe('totalDoPedido', () => {
  it('soma os totais arredondados dos itens válidos', () => {
    expect(totalDoPedido(preenchido().itens).toFixed(2)).toBe('300.68');
  });

  it('ignora linhas incompletas', () => {
    expect(totalDoPedido([itemVazio()]).toFixed(2)).toBe('0.00');
  });
});

describe('paraNovoPedido', () => {
  it('envia decimais como texto, apara textos e não envia totais', () => {
    expect(paraNovoPedido(preenchido())).toEqual({
      obraId: 1,
      fornecedorId: 2,
      dataPedido: '2026-10-28',
      observacoes: 'urgente',
      itens: [
        {
          descricao: 'Cimento',
          quantidade: '2.5',
          unidade: 'UN',
          precoUnitario: '0.15',
        },
        {
          descricao: 'Areia',
          quantidade: '3',
          unidade: 'M3',
          precoUnitario: '100.10',
        },
      ],
    });
  });
});
