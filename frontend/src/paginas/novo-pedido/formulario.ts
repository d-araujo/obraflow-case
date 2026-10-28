import { Decimal } from 'decimal.js';
import type { NovoPedido, Unidade } from '../../api/tipos';
import {
  calcularTotalItem,
  paraDecimal,
  somar,
  type ValorDigitado,
} from '../../comum/dinheiro';

export interface ItemFormulario {
  chave: string;
  descricao: string;
  quantidade: ValorDigitado;
  unidade: Unidade | null;
  precoUnitario: ValorDigitado;
}

export interface ValoresPedido {
  obraId: number | null;
  fornecedorId: number | null;
  dataPedido: string | null;
  observacoes: string;
  itens: ItemFormulario[];
}

export function itemVazio(): ItemFormulario {
  return {
    chave: crypto.randomUUID(),
    descricao: '',
    quantidade: '',
    unidade: 'UN',
    precoUnitario: '',
  };
}

export function valoresIniciais(hoje: string): ValoresPedido {
  return {
    obraId: null,
    fornecedorId: null,
    dataPedido: hoje,
    observacoes: '',
    itens: [itemVazio()],
  };
}

// Os caminhos ("itens.0.quantidade") são os mesmos que a API devolve em `detalhes`, então erros
// do front e do back aparecem no mesmo campo.
export function validarPedido(valores: ValoresPedido): Record<string, string> {
  const erros: Record<string, string> = {};
  if (!valores.obraId) erros.obraId = 'Selecione a obra.';
  if (!valores.fornecedorId) erros.fornecedorId = 'Selecione o fornecedor.';
  if (!valores.dataPedido) erros.dataPedido = 'Informe a data do pedido.';
  if (valores.observacoes.length > 1000) {
    erros.observacoes = 'Use no máximo 1000 caracteres.';
  }
  if (valores.itens.length === 0) {
    erros.itens = 'O pedido precisa de pelo menos um item.';
  }

  valores.itens.forEach((item, i) => {
    const campo = (nome: string) => `itens.${i}.${nome}`;
    if (!item.descricao.trim()) {
      erros[campo('descricao')] = 'Descreva o material ou serviço.';
    }

    const quantidade = paraDecimal(item.quantidade);
    if (!quantidade || quantidade.lte(0)) {
      erros[campo('quantidade')] = 'Informe uma quantidade maior que zero.';
    } else if (quantidade.decimalPlaces() > 3) {
      erros[campo('quantidade')] = 'Use no máximo 3 casas decimais.';
    }

    if (!item.unidade) erros[campo('unidade')] = 'Escolha a unidade.';

    const preco = paraDecimal(item.precoUnitario);
    if (!preco || preco.lt(0)) {
      erros[campo('precoUnitario')] =
        'Informe um preço igual ou maior que zero.';
    } else if (preco.decimalPlaces() > 2) {
      erros[campo('precoUnitario')] = 'Use no máximo 2 casas decimais.';
    }
  });
  return erros;
}

export function resumirPendencias(erros: Record<string, string>): string[] {
  const itensIncompletos = new Set(
    Object.keys(erros)
      .filter((campo) => /^itens\.\d+\./.test(campo))
      .map((campo) => campo.split('.')[1]),
  ).size;
  return [
    erros.obraId && 'selecione a obra',
    erros.fornecedorId && 'selecione o fornecedor',
    erros.dataPedido && 'informe a data',
    erros.itens && 'adicione um item',
    itensIncompletos === 1 && 'complete 1 item',
    itensIncompletos > 1 && `complete ${itensIncompletos} itens`,
  ].filter((pendencia): pendencia is string => Boolean(pendencia));
}

export function totalDoPedido(itens: ItemFormulario[]): Decimal {
  return somar(
    itens
      .map((item) => calcularTotalItem(item.quantidade, item.precoUnitario))
      .filter((total): total is Decimal => total !== null),
  );
}

// Totais não vão no corpo: o back recalcula tudo a partir de quantidade e preço.
export function paraNovoPedido(valores: ValoresPedido): NovoPedido {
  const observacoes = valores.observacoes.trim();
  return {
    obraId: valores.obraId as number,
    fornecedorId: valores.fornecedorId as number,
    dataPedido: valores.dataPedido as string,
    ...(observacoes && { observacoes }),
    itens: valores.itens.map((item) => ({
      descricao: item.descricao.trim(),
      quantidade: new Decimal(item.quantidade).toFixed(),
      unidade: item.unidade as Unidade,
      precoUnitario: new Decimal(item.precoUnitario).toFixed(2),
    })),
  };
}
