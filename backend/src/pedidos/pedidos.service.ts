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
import { StatusEtapa, StatusPedido } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { Decisao, planejarDecisao } from './decisao.js';
import { CriarPedidoDto } from './dto/criar-pedido.dto.js';
import { ListarPedidosQuery } from './dto/listar-pedidos.query.js';
import {
  PedidoDetalheResposta,
  PedidoResumoResposta,
} from './pedido.resposta.js';

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

  async listar(filtro: ListarPedidosQuery): Promise<PedidoResumoResposta[]> {
    const { status, aprovadorId } = filtro;
    const pedidos = await this.prisma.pedido.findMany({
      where: {
        status,
        ...(aprovadorId && {
          etapas: { some: { aprovadorId, status: StatusEtapa.PENDENTE } },
        }),
      },
      include: doResumo,
      orderBy: { id: 'desc' },
    });

    // O Prisma não compara a coluna da relação com a do pai (etapa.ordem = pedido.etapaAtual):
    // o banco reduz aos pedidos em que o aprovador ainda tem etapa pendente e aqui ficam só os da vez dele.
    const resultado = aprovadorId
      ? pedidos.filter((pedido) =>
          pedido.etapas.some(
            (etapa) =>
              etapa.ordem === pedido.etapaAtual &&
              etapa.aprovadorId === aprovadorId,
          ),
        )
      : pedidos;
    return resultado.map(paraResumo);
  }

  async detalhar(id: number): Promise<PedidoDetalheResposta> {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
      include: doDetalhe,
    });
    if (!pedido) throw naoEncontrado('Pedido', id);
    return paraDetalhe(pedido);
  }

  aprovar(id: number, usuarioId: number): Promise<PedidoDetalheResposta> {
    return this.decidir(id, usuarioId, { tipo: 'aprovar' });
  }

  rejeitar(
    id: number,
    usuarioId: number,
    motivo: string,
  ): Promise<PedidoDetalheResposta> {
    return this.decidir(id, usuarioId, { tipo: 'rejeitar', motivo });
  }

  // Fica em READ COMMITTED de propósito: é nesse nível que o UPDATE bloqueado reavalia o WHERE e
  // devolve count 0. Em RepeatableRead o Postgres abortaria com erro de serialização.
  private async decidir(
    id: number,
    usuarioId: number,
    decisao: Decisao,
  ): Promise<PedidoDetalheResposta> {
    await this.prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.findUnique({
        where: { id },
        include: {
          etapas: { include: { aprovador: { select: { nome: true } } } },
        },
      });
      if (!pedido) throw naoEncontrado('Pedido', id);

      const plano = planejarDecisao(pedido, usuarioId, decisao);

      // Trava otimista: o UPDATE só casa se o pedido continua na etapa lida acima. Se outra decisão
      // chegou antes, ela segura o lock da linha; quando commita, o Postgres reavalia este WHERE na
      // versão nova (etapaAtual já mudou) e nenhuma linha é afetada.
      const { count } = await tx.pedido.updateMany({
        where: {
          id,
          status: StatusPedido.PENDENTE,
          etapaAtual: plano.etapa.ordem,
        },
        data: plano.pedido,
      });
      if (count === 0) {
        throw new ErroApi(
          HttpStatus.CONFLICT,
          'DECISAO_CONCORRENTE',
          'Outra decisão foi registrada neste pedido ao mesmo tempo. Atualize a tela e tente novamente.',
        );
      }

      await tx.etapa.update({
        where: { id: plano.etapa.id },
        data: {
          status: plano.etapa.status,
          motivo: plano.etapa.motivo,
          decididaEm: new Date(),
        },
      });
      if (plano.cancelarEtapasApos !== null) {
        await tx.etapa.updateMany({
          where: { pedidoId: id, ordem: { gt: plano.cancelarEtapasApos } },
          data: { status: StatusEtapa.CANCELADA },
        });
      }
    });

    return this.detalhar(id);
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
