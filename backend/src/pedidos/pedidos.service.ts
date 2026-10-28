import { HttpStatus, Injectable } from '@nestjs/common';
import { descreverFaltaDeFaixa } from '../alcada/cadeia.js';
import { CadeiaService } from '../alcada/cadeia.service.js';
import {
  calcularTotalItem,
  formatarReais,
  somar,
  TOTAL_MAXIMO,
} from '../comum/dinheiro.js';
import {
  ErroApi,
  naoEncontrado,
  referenciaInvalida,
} from '../comum/erro-api.js';
import { Prisma } from '../generated/prisma/client.js';
import { StatusPedido } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CriarPedidoDto } from './dto/criar-pedido.dto.js';
import { PedidoDetalheResposta } from './pedido.resposta.js';

const doResumo = {
  obra: { select: { id: true, nome: true } },
  fornecedor: { select: { id: true, nome: true } },
  etapas: {
    include: { aprovador: { select: { id: true, nome: true } } },
    orderBy: { ordem: 'asc' },
  },
  _count: { select: { itens: true } },
} satisfies Prisma.PedidoInclude;

const doDetalhe = {
  ...doResumo,
  itens: { orderBy: { id: 'asc' } },
} satisfies Prisma.PedidoInclude;

type PedidoComResumo = Prisma.PedidoGetPayload<{ include: typeof doResumo }>;
type PedidoComDetalhe = Prisma.PedidoGetPayload<{ include: typeof doDetalhe }>;

@Injectable()
export class PedidosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cadeia: CadeiaService,
  ) {}

  async criar(dto: CriarPedidoDto): Promise<PedidoDetalheResposta> {
    const itens = dto.itens.map((item) => ({
      descricao: item.descricao,
      quantidade: item.quantidade,
      unidade: item.unidade,
      precoUnitario: item.precoUnitario,
      total: calcularTotalItem(item.quantidade, item.precoUnitario),
    }));
    const total = somar(itens.map((item) => item.total));
    if (total.gt(TOTAL_MAXIMO)) {
      throw new ErroApi(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'TOTAL_ACIMA_DO_SUPORTADO',
        `O total do pedido não pode passar de ${formatarReais(TOTAL_MAXIMO)}.`,
      );
    }

    // RepeatableRead: o include das regras pode virar várias queries, e todas precisam enxergar o
    // mesmo estado das faixas mesmo que alguém edite a regra durante a criação. Como aqui só há
    // INSERTs, esse nível não gera conflito de serialização.
    const id = await this.prisma.$transaction(
      async (tx) => {
        const calculo = await this.cadeia.calcular(dto.obraId, total, tx);
        if (!calculo) throw referenciaInvalida('Obra', dto.obraId);

        const fornecedor = await tx.fornecedor.findUnique({
          where: { id: dto.fornecedorId },
        });
        if (!fornecedor)
          throw referenciaInvalida('Fornecedor', dto.fornecedorId);

        const { obra, resultado } = calculo;
        if (!resultado.aplicavel) {
          throw new ErroApi(
            HttpStatus.UNPROCESSABLE_ENTITY,
            'SEM_FAIXA_APLICAVEL',
            descreverFaltaDeFaixa(resultado, obra.nome, total),
          );
        }

        const pedido = await tx.pedido.create({
          data: {
            obraId: obra.id,
            fornecedorId: fornecedor.id,
            dataPedido: new Date(dto.dataPedido),
            observacoes: dto.observacoes || null,
            total: total.toFixed(2),
            status: StatusPedido.PENDENTE,
            etapaAtual: 1,
            itens: {
              create: itens.map((item) => ({
                ...item,
                total: item.total.toFixed(2),
              })),
            },
            etapas: { create: resultado.etapas },
          },
          select: { id: true },
        });
        return pedido.id;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );

    return this.detalhar(id);
  }

  async detalhar(id: number): Promise<PedidoDetalheResposta> {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
      include: doDetalhe,
    });
    if (!pedido) throw naoEncontrado('Pedido', id);
    return paraDetalhe(pedido);
  }
}

function paraResumo(pedido: PedidoComResumo) {
  return {
    id: pedido.id,
    obra: pedido.obra,
    fornecedor: pedido.fornecedor,
    dataPedido: pedido.dataPedido.toISOString().slice(0, 10),
    quantidadeItens: pedido._count.itens,
    total: pedido.total.toFixed(2),
    status: pedido.status,
    etapaAtual: pedido.etapaAtual,
    etapas: pedido.etapas.map((etapa) => ({
      ordem: etapa.ordem,
      aprovador: etapa.aprovador,
      status: etapa.status,
      motivo: etapa.motivo,
      decididaEm: etapa.decididaEm,
    })),
  };
}

function paraDetalhe(pedido: PedidoComDetalhe): PedidoDetalheResposta {
  return {
    ...paraResumo(pedido),
    observacoes: pedido.observacoes,
    criadoEm: pedido.criadoEm,
    itens: pedido.itens.map((item) => ({
      id: item.id,
      descricao: item.descricao,
      quantidade: item.quantidade.toString(),
      unidade: item.unidade,
      precoUnitario: item.precoUnitario.toFixed(2),
      total: item.total.toFixed(2),
    })),
  };
}
