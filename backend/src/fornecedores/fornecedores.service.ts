import { HttpStatus, Injectable } from '@nestjs/common';
import { ErroApi } from '../comum/erro-api.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CriarFornecedorDto } from './dto/criar-fornecedor.dto.js';
import { FornecedorResposta } from './fornecedor.resposta.js';

const campos = { id: true, nome: true, cnpj: true } as const;

@Injectable()
export class FornecedoresService {
  constructor(private readonly prisma: PrismaService) {}

  listar(): Promise<FornecedorResposta[]> {
    return this.prisma.fornecedor.findMany({
      select: campos,
      orderBy: { nome: 'asc' },
    });
  }

  async criar(dto: CriarFornecedorDto): Promise<FornecedorResposta> {
    if (dto.cnpj) {
      const existente = await this.prisma.fornecedor.findUnique({
        where: { cnpj: dto.cnpj },
      });
      if (existente) {
        throw new ErroApi(
          HttpStatus.CONFLICT,
          'CONFLITO',
          `Já existe um fornecedor com o CNPJ ${dto.cnpj}.`,
        );
      }
    }
    return this.prisma.fornecedor.create({
      data: { nome: dto.nome, cnpj: dto.cnpj || null },
      select: campos,
    });
  }
}
