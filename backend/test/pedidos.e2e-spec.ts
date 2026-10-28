import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { corpoDoPedido, criarApp, criarCenario, limparBanco } from './apoio.js';

describe('Pedidos (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await criarApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(() => limparBanco(prisma));

  afterAll(() => app.close());

  it('recalcula os totais no back e ignora os enviados pelo front', async () => {
    const cenario = await criarCenario(app, 1);
    const corpo = {
      ...corpoDoPedido(cenario, [
        {
          descricao: 'Cimento',
          quantidade: '2.5',
          unidade: 'KG',
          precoUnitario: '0.15',
          total: '999.00',
        },
        {
          descricao: 'Areia',
          quantidade: '3',
          unidade: 'M3',
          precoUnitario: '100.10',
        },
      ]),
      total: '1.00',
    };

    const resposta = await request(app.getHttpServer())
      .post('/pedidos')
      .send(corpo)
      .expect(201);

    expect(resposta.body.total).toBe('300.68');
    expect(resposta.body.itens.map((i: { total: string }) => i.total)).toEqual([
      '0.38',
      '300.30',
    ]);
    expect(resposta.body.etapaAtual).toBe(1);
  });

  it('sem faixa aplicável: responde 422 e não grava nada', async () => {
    const cenario = await criarCenario(app, 1);
    await prisma.faixa.deleteMany();

    const resposta = await request(app.getHttpServer())
      .post('/pedidos')
      .send(corpoDoPedido(cenario))
      .expect(422);

    expect(resposta.body.codigo).toBe('SEM_FAIXA_APLICAVEL');
    expect(await prisma.pedido.count()).toBe(0);
    expect(await prisma.item.count()).toBe(0);
  });

  it('editar a regra não muda a cadeia de pedidos já criados', async () => {
    const cenario = await criarCenario(app, 2);
    const http = app.getHttpServer();
    const pedido = await request(http)
      .post('/pedidos')
      .send(corpoDoPedido(cenario))
      .expect(201);

    const [faixa] = await prisma.faixa.findMany();
    await request(http)
      .put(`/faixas/${faixa.id}`)
      .send({ limiteMaximo: null, aprovadorIds: [cenario.usuarioIds[1]] })
      .expect(200);

    const depois = await request(http).get(`/pedidos/${pedido.body.id}`);
    expect(
      depois.body.etapas.map(
        (e: { aprovador: { id: number } }) => e.aprovador.id,
      ),
    ).toEqual(cenario.usuarioIds);
  });
});
