import { HttpStatus, Injectable } from '@nestjs/common';
import { formatarReais } from '../comum/dinheiro.js';
import { ErroApi, naoEncontrado } from '../comum/erro-api.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SalvarFaixaDto } from './dto/salvar-faixa.dto.js';
import { FaixaResposta } from './faixa.resposta.js';

const comAprovadores = {
  aprovadores: {
    include: { usuario: { select: { id: true, nome: true } } },
    orderBy: { ordem: 'asc' },
  },
} satisfies Prisma.FaixaInclude;

type FaixaComAprovadores = Prisma.FaixaGetPayload<{
  include: typeof comAprovadores;
}>;

@Injectable()
export class FaixasService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(obraId: number): Promise<FaixaResposta[]> {
    await this.garantirObra(obraId);
    const faixas = await this.prisma.faixa.findMany({
      where: { obraId },
      include: comAprovadores,
      orderBy: { limiteMaximo: { sort: 'asc', nulls: 'last' } },
    });
    return faixas.map(paraResposta);
  }

  async criar(obraId: number, dto: SalvarFaixaDto): Promise<FaixaResposta> {
    await this.garantirObra(obraId);
    await this.validar(obraId, dto);
    const faixa = await this.prisma.faixa.create({
      data: {
        obraId,
        limiteMaximo: dto.limiteMaximo,
        aprovadores: { create: emOrdem(dto.aprovadorIds) },
      },
      include: comAprovadores,
    });
    return paraResposta(faixa);
  }

  async atualizar(id: number, dto: SalvarFaixaDto): Promise<FaixaResposta> {
    const atual = await this.prisma.faixa.findUnique({ where: { id } });
    if (!atual) throw naoEncontrado('Faixa', id);
    await this.validar(atual.obraId, dto, id);

    // Apagar e recriar evita colidir com a unique (faixaId, ordem) ao trocar posições; a
    // transação garante que ninguém leia a faixa sem aprovadores no meio da troca.
    const faixa = await this.prisma.$transaction(async (tx) => {
      await tx.aprovadorFaixa.deleteMany({ where: { faixaId: id } });
      return tx.faixa.update({
        where: { id },
        data: {
          limiteMaximo: dto.limiteMaximo,
          aprovadores: { create: emOrdem(dto.aprovadorIds) },
        },
        include: comAprovadores,
      });
    });
    return paraResposta(faixa);
  }

  async remover(id: number): Promise<void> {
    const { count } = await this.prisma.faixa.deleteMany({ where: { id } });
    if (count === 0) throw naoEncontrado('Faixa', id);
  }

  private async garantirObra(obraId: number) {
    const obra = await this.prisma.obra.findUnique({ where: { id: obraId } });
    if (!obra) throw naoEncontrado('Obra', obraId);
  }

  private async validar(obraId: number, dto: SalvarFaixaDto, faixaId?: number) {
    const conflitante = await this.prisma.faixa.findFirst({
      where: {
        obraId,
        limiteMaximo: dto.limiteMaximo,
        ...(faixaId && { id: { not: faixaId } }),
      },
    });
    if (conflitante) {
      throw new ErroApi(
        HttpStatus.CONFLICT,
        'CONFLITO',
        dto.limiteMaximo === null
          ? 'Esta obra já tem uma faixa sem teto.'
          : `Esta obra já tem uma faixa com limite de ${formatarReais(dto.limiteMaximo)}.`,
      );
    }

    const encontrados = await this.prisma.usuario.count({
      where: { id: { in: dto.aprovadorIds } },
    });
    if (encontrados !== dto.aprovadorIds.length) {
      throw new ErroApi(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'REFERENCIA_INVALIDA',
        'Um ou mais aprovadores informados não existem.',
      );
    }
  }
}

function emOrdem(aprovadorIds: number[]) {
  return aprovadorIds.map((usuarioId, i) => ({ usuarioId, ordem: i + 1 }));
}

function paraResposta(faixa: FaixaComAprovadores): FaixaResposta {
  return {
    id: faixa.id,
    obraId: faixa.obraId,
    limiteMaximo: faixa.limiteMaximo?.toFixed(2) ?? null,
    aprovadores: faixa.aprovadores.map(({ ordem, usuario }) => ({
      ordem,
      usuario,
    })),
  };
}
