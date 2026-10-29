import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { corpoDoPedido, criarApp, criarCenario, limparBanco } from './apoio.js';

describe('Decisão pela API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await criarApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(() => limparBanco(prisma));

  afterAll(() => app.close());

  // Cadeia: primeiro → segundo.
  async function criarPedido() {
    const cenario = await criarCenario(app, 2);
    const pedido = await request(app.getHttpServer())
      .post('/pedidos')
      .send(corpoDoPedido(cenario))
      .expect(201);
    const [primeiro, segundo] = cenario.usuarioIds;
    return { pedidoId: pedido.body.id as number, primeiro, segundo };
  }

  async function estadoDoPedido(pedidoId: number) {
    const pedido = await prisma.pedido.findUniqueOrThrow({
      where: { id: pedidoId },
      include: { etapas: { orderBy: { ordem: 'asc' } } },
    });
    return {
      status: pedido.status,
      etapaAtual: pedido.etapaAtual,
      etapas: pedido.etapas.map((e) => e.status),
    };
  }

  const intacto = {
    status: 'PENDENTE',
    etapaAtual: 1,
    etapas: ['PENDENTE', 'PENDENTE'],
  };

  it('quem não é o aprovador da etapa atual não consegue aprovar nem rejeitar', async () => {
    const { pedidoId, segundo } = await criarPedido();
    const http = app.getHttpServer();

    const aprovacao = await request(http)
      .post(`/pedidos/${pedidoId}/aprovar`)
      .set('X-Usuario-Id', String(segundo))
      .expect(403);
    await request(http)
      .post(`/pedidos/${pedidoId}/rejeitar`)
      .set('X-Usuario-Id', String(segundo))
      .send({ motivo: 'Tentando pular a vez' })
      .expect(403);

    expect(aprovacao.body.codigo).toBe('FORA_DA_VEZ');
    expect(await estadoDoPedido(pedidoId)).toEqual(intacto);
  });

  it('sem o header X-Usuario-Id a decisão é recusada', async () => {
    const { pedidoId } = await criarPedido();

    await request(app.getHttpServer())
      .post(`/pedidos/${pedidoId}/aprovar`)
      .expect(401);

    expect(await estadoDoPedido(pedidoId)).toEqual(intacto);
  });

  it('rejeição sem motivo é bloqueada e não altera o pedido', async () => {
    const { pedidoId, primeiro } = await criarPedido();
    const rejeitar = (corpo: object) =>
      request(app.getHttpServer())
        .post(`/pedidos/${pedidoId}/rejeitar`)
        .set('X-Usuario-Id', String(primeiro))
        .send(corpo);

    const vazio = await rejeitar({ motivo: '   ' }).expect(400);
    await rejeitar({}).expect(400);

    expect(vazio.body.detalhes).toEqual([
      { campo: 'motivo', mensagem: 'Informe o motivo da rejeição.' },
    ]);
    expect(await estadoDoPedido(pedidoId)).toEqual(intacto);
  });
});
