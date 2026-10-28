import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { FiltroErros } from './comum/filtro-erros.filter.js';
import { HEADER_USUARIO } from './comum/usuario-atual.decorator.js';
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

export function configurarSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('ObraFlow — Pedidos de compra')
    .setDescription(
      'Pedidos de compra por obra com aprovação por alçada de valor. ' +
        `As decisões exigem o header ${HEADER_USUARIO} (botão Authorize).`,
    )
    .setVersion('1.0')
    .addApiKey(
      { type: 'apiKey', in: 'header', name: HEADER_USUARIO },
      'usuario',
    )
    .build();
  SwaggerModule.setup('docs', app, () =>
    SwaggerModule.createDocument(app, config),
  );
}
