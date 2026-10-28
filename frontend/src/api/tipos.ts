export type Unidade = 'UN' | 'KG' | 'M' | 'M2' | 'M3' | 'H';
export type StatusPedido = 'PENDENTE' | 'APROVADO' | 'REJEITADO';
export type StatusEtapa = 'PENDENTE' | 'APROVADA' | 'REJEITADA' | 'CANCELADA';

export interface Referencia {
  id: number;
  nome: string;
}

export interface Obra extends Referencia {
  quantidadeFaixas: number;
  criadoEm: string;
}

export interface Usuario extends Referencia {
  email: string;
}

export interface Fornecedor extends Referencia {
  cnpj: string | null;
}

export interface Faixa {
  id: number;
  obraId: number;
  limiteMaximo: string | null;
  aprovadores: { ordem: number; usuario: Referencia }[];
}

export interface SalvarFaixa {
  limiteMaximo: string | null;
  aprovadorIds: number[];
}

export interface PreviaCadeia {
  aplicavel: boolean;
  etapas: { ordem: number; aprovador: Referencia }[];
  motivo: 'OBRA_SEM_FAIXAS' | 'ACIMA_DO_MAIOR_LIMITE' | null;
  mensagem: string | null;
}

export interface Etapa {
  ordem: number;
  aprovador: Referencia;
  status: StatusEtapa;
  motivo: string | null;
  decididaEm: string | null;
}

export interface PedidoResumo {
  id: number;
  obra: Referencia;
  fornecedor: Referencia;
  dataPedido: string;
  quantidadeItens: number;
  total: string;
  status: StatusPedido;
  etapaAtual: number | null;
  etapas: Etapa[];
}

export interface ItemPedido {
  id: number;
  descricao: string;
  quantidade: string;
  unidade: Unidade;
  precoUnitario: string;
  total: string;
}

export interface PedidoDetalhe extends PedidoResumo {
  observacoes: string | null;
  criadoEm: string;
  itens: ItemPedido[];
}

export interface NovoPedido {
  obraId: number;
  fornecedorId: number;
  dataPedido: string;
  observacoes?: string;
  itens: {
    descricao: string;
    quantidade: string;
    unidade: Unidade;
    precoUnitario: string;
  }[];
}

export interface FiltroPedidos {
  status?: StatusPedido;
  aprovadorId?: number;
}
