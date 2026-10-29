import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { Prisma } from '../src/generated/prisma/client.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { criarApp, criarCenario, limparBanco } from './apoio.js';

describe('Faixas sem teto (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await criarApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(() => limparBanco(prisma));

  afterAll(() => app.close());

  // O cenário já cria uma faixa sem teto na obra.
  it('a API recusa uma segunda faixa sem teto na mesma obra', async () => {
    const { obraId, usuarioIds } = await criarCenario(app, 1);
    const http = app.getHttpServer();

    const criacao = await request(http)
      .post(`/obras/${obraId}/faixas`)
      .send({ limiteMaximo: null, aprovadorIds: usuarioIds })
      .expect(409);
    const comTeto = await request(http)
      .post(`/obras/${obraId}/faixas`)
      .send({ limiteMaximo: '1000.00', aprovadorIds: usuarioIds })
      .expect(201);
    await request(http)
      .put(`/faixas/${comTeto.body.id}`)
      .send({ limiteMaximo: null, aprovadorIds: usuarioIds })
      .expect(409);

    expect(criacao.body.mensagem).toBe('Esta obra já tem uma faixa sem teto.');
    expect(
      await prisma.faixa.count({ where: { obraId, limiteMaximo: null } }),
    ).toBe(1);
  });

  it('o banco recusa a segunda faixa sem teto mesmo sem passar pelo service', async () => {
    const { obraId } = await criarCenario(app, 1);

    const erro: unknown = await prisma.faixa
      .create({ data: { obraId, limiteMaximo: null } })
      .catch((e: unknown) => e);

    expect(erro).toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
    expect((erro as Prisma.PrismaClientKnownRequestError).code).toBe('P2002');
  });

  it('obras diferentes podem ter, cada uma, a sua faixa sem teto', async () => {
    await criarCenario(app, 1);
    const outra = await prisma.obra.create({ data: { nome: 'Outra obra' } });

    await prisma.faixa.create({
      data: { obraId: outra.id, limiteMaximo: null },
    });

    expect(await prisma.faixa.count({ where: { limiteMaximo: null } })).toBe(2);
  });
});
