import {
  createParamDecorator,
  ExecutionContext,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { ErroApi } from './erro-api.js';

export const HEADER_USUARIO = 'X-Usuario-Id';

// Sem autenticação neste projeto: quem age é informado pelo header e confiado como está.
export const UsuarioAtual = createParamDecorator(
  (_: unknown, contexto: ExecutionContext): number => {
    const valor = contexto
      .switchToHttp()
      .getRequest<Request>()
      .header(HEADER_USUARIO);
    const id = Number(valor);
    if (!valor || !Number.isInteger(id) || id <= 0) {
      throw new ErroApi(
        HttpStatus.UNAUTHORIZED,
        'USUARIO_NAO_IDENTIFICADO',
        `Informe o id do usuário que está agindo no header ${HEADER_USUARIO}.`,
      );
    }
    return id;
  },
);
