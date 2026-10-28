import { HttpStatus, ParseIntPipe } from '@nestjs/common';
import { ErroApi } from './erro-api.js';

export const IdPipe = new ParseIntPipe({
  exceptionFactory: () =>
    new ErroApi(
      HttpStatus.BAD_REQUEST,
      'REQUISICAO_INVALIDA',
      'O id na URL deve ser um número inteiro.',
    ),
});
