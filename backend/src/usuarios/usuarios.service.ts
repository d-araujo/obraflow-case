import { HttpStatus, Injectable } from '@nestjs/common';
import { ErroApi } from '../comum/erro-api.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CriarUsuarioDto } from './dto/criar-usuario.dto.js';
import { UsuarioResposta } from './usuario.resposta.js';

const campos = { id: true, nome: true, email: true } as const;

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  listar(): Promise<UsuarioResposta[]> {
    return this.prisma.usuario.findMany({
      select: campos,
      orderBy: { nome: 'asc' },
    });
  }

  async criar(dto: CriarUsuarioDto): Promise<UsuarioResposta> {
    const existente = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });
    if (existente) {
      throw new ErroApi(
        HttpStatus.CONFLICT,
        'CONFLITO',
        `Já existe um usuário com o e-mail ${dto.email}.`,
      );
    }
    return this.prisma.usuario.create({ data: dto, select: campos });
  }
}
