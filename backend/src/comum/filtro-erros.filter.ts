import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Prisma } from '../generated/prisma/client.js';
import { CodigoErro, DetalheErro, ErroApi } from './erro-api.js';

interface CorpoErro {
  statusCode: number;
  codigo: CodigoErro;
  mensagem: string;
  detalhes?: DetalheErro[];
}

const PADRAO_POR_STATUS: Partial<
  Record<number, { codigo: CodigoErro; mensagem: string }>
> = {
  [HttpStatus.BAD_REQUEST]: {
    codigo: 'REQUISICAO_INVALIDA',
    mensagem: 'Requisição inválida.',
  },
  [HttpStatus.NOT_FOUND]: {
    codigo: 'NAO_ENCONTRADO',
    mensagem: 'Recurso não encontrado.',
  },
  [HttpStatus.CONFLICT]: {
    codigo: 'CONFLITO',
    mensagem: 'A operação conflita com o estado atual dos dados.',
  },
};

@Catch()
export class FiltroErros implements ExceptionFilter {
  private readonly logger = new Logger(FiltroErros.name);

  catch(excecao: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const requisicao = http.getRequest<Request>();
    const corpo = this.converter(excecao);

    if (corpo.statusCode >= 500) {
      this.logger.error(
        `${requisicao.method} ${requisicao.url}`,
        excecao instanceof Error ? excecao.stack : String(excecao),
      );
    }

    http
      .getResponse<Response>()
      .status(corpo.statusCode)
      .json({
        ...corpo,
        caminho: requisicao.url,
        dataHora: new Date().toISOString(),
      });
  }

  private converter(excecao: unknown): CorpoErro {
    if (excecao instanceof ErroApi) {
      return {
        statusCode: excecao.getStatus(),
        codigo: excecao.codigo,
        mensagem: excecao.message,
        detalhes: excecao.detalhes,
      };
    }

    // Última barreira: as constraints do banco valem mesmo quando duas requisições passam juntas
    // pelas validações do service.
    if (excecao instanceof Prisma.PrismaClientKnownRequestError) {
      if (excecao.code === 'P2002') {
        return {
          statusCode: HttpStatus.CONFLICT,
          codigo: 'CONFLITO',
          mensagem: 'Já existe um registro com esses dados.',
        };
      }
      if (excecao.code === 'P2025') {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          codigo: 'NAO_ENCONTRADO',
          mensagem: 'Registro não encontrado.',
        };
      }
      if (excecao.code === 'P2003') {
        return {
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          codigo: 'REFERENCIA_INVALIDA',
          mensagem: 'O registro referencia um dado que não existe.',
        };
      }
    }

    if (excecao instanceof HttpException) {
      const status = excecao.getStatus();
      const padrao = PADRAO_POR_STATUS[status];
      if (padrao) return { statusCode: status, ...padrao };
      if (status < 500) {
        return {
          statusCode: status,
          codigo: 'REQUISICAO_INVALIDA',
          mensagem: excecao.message,
        };
      }
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      codigo: 'ERRO_INTERNO',
      mensagem: 'Erro interno inesperado. Tente novamente em instantes.',
    };
  }
}
