import { Injectable } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { montarCadeia } from './cadeia.js';

const regrasDaObra = {
  faixas: {
    include: {
      aprovadores: {
        include: { usuario: { select: { id: true, nome: true } } },
      },
    },
  },
} satisfies Prisma.ObraInclude;

@Injectable()
export class CadeiaService {
  constructor(private readonly prisma: PrismaService) {}

  // Na criação do pedido recebe o client da transação, para as regras serem lidas no mesmo snapshot
  // em que o pedido é gravado.
  async calcular(
    obraId: number,
    total: Decimal.Value,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    const obra = await db.obra.findUnique({
      where: { id: obraId },
      include: regrasDaObra,
    });
    if (!obra) return null;

    const nomes = new Map(
      obra.faixas.flatMap((faixa) =>
        faixa.aprovadores.map(({ usuario }) => [usuario.id, usuario.nome]),
      ),
    );
    return { obra, nomes, resultado: montarCadeia(obra.faixas, total) };
  }
}
