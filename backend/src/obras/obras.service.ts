import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CriarObraDto } from './dto/criar-obra.dto.js';
import { ObraResposta } from './obra.resposta.js';

const comContagem = { _count: { select: { faixas: true } } } as const;

@Injectable()
export class ObrasService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(): Promise<ObraResposta[]> {
    const obras = await this.prisma.obra.findMany({
      include: comContagem,
      orderBy: { nome: 'asc' },
    });
    return obras.map(paraResposta);
  }

  async criar(dto: CriarObraDto): Promise<ObraResposta> {
    const obra = await this.prisma.obra.create({
      data: { nome: dto.nome },
      include: comContagem,
    });
    return paraResposta(obra);
  }
}

function paraResposta(obra: {
  id: number;
  nome: string;
  criadoEm: Date;
  _count: { faixas: number };
}): ObraResposta {
  return {
    id: obra.id,
    nome: obra.nome,
    quantidadeFaixas: obra._count.faixas,
    criadoEm: obra.criadoEm,
  };
}
