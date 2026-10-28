import { INestApplication, ValidationPipe } from '@nestjs/common';
import { FiltroErros } from './comum/filtro-erros.filter.js';
import { criarErroDeValidacao } from './comum/validacao.js';

export function configurarApp(app: INestApplication) {
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  });
  app.useGlobalPipes(
    new ValidationPipe({
      // Descarta campos fora do DTO (como totais enviados pelo front) em vez de rejeitar a requisição.
      whitelist: true,
      transform: true,
      stopAtFirstError: true,
      exceptionFactory: criarErroDeValidacao,
    }),
  );
  app.useGlobalFilters(new FiltroErros());
}
