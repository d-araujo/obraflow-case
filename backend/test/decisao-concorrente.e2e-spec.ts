import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { corpoDoPedido, criarApp, criarCenario, limparBanco } from './apoio.js';

describe('Decisão concorrente (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await criarApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(() => limparBanco(prisma));

  afterAll(() => app.close());

  async function criarPedido(quantidadeAprovadores: number) {
    const cenario = await criarCenario(app, quantidadeAprovadores);
    const pedido = await request(app.getHttpServer())
      .post('/pedidos')
      .send(corpoDoPedido(cenario))
      .expect(201);
    return { pedidoId: pedido.body.id as number, ...cenario };
  }

  function aprovar(pedidoId: number, usuarioId: number) {
    return request(app.getHttpServer())
      .post(`/pedidos/${pedidoId}/aprovar`)
      .set('X-Usuario-Id', String(usuarioId));
  }

  it('duas aprovações simultâneas da mesma etapa: apenas uma vence', async () => {
    const { pedidoId, usuarioIds } = await criarPedido(1);
    const [aprovador] = usuarioIds;

    const respostas = await Promise.all([
      aprovar(pedidoId, aprovador),
      aprovar(pedidoId, aprovador),
    ]);

    expect(respostas.map((r) => r.status).sort((a, b) => a - b)).toEqual([
      200, 409,
    ]);
    const pedido = await prisma.pedido.findUniqueOrThrow({
      where: { id: pedidoId },
      include: { etapas: true },
    });
    expect(pedido.status).toBe('APROVADO');
    expect(pedido.etapaAtual).toBeNull();
    expect(pedido.etapas).toHaveLength(1);
    expect(pedido.etapas[0].status).toBe('APROVADA');
  });

  it('dez aprovações simultâneas da 1ª etapa não pulam a 2ª', async () => {
    const { pedidoId, usuarioIds } = await criarPedido(2);
    const [primeiro] = usuarioIds;

    const respostas = await Promise.all(
      Array.from({ length: 10 }, () => aprovar(pedidoId, primeiro)),
    );

    const status = respostas.map((r) => r.status);
    expect(status.filter((s) => s === 200)).toHaveLength(1);
    // Quem leu antes do commit da vencedora cai na trava (409); quem leu depois já vê a etapa 2,
    // que é de outra pessoa (403).
    expect(status.every((s) => [200, 403, 409].includes(s))).toBe(true);

    const pedido = await prisma.pedido.findUniqueOrThrow({
      where: { id: pedidoId },
      include: { etapas: { orderBy: { ordem: 'asc' } } },
    });
    expect(pedido.status).toBe('PENDENTE');
    expect(pedido.etapaAtual).toBe(2);
    expect(pedido.etapas.map((e) => e.status)).toEqual([
      'APROVADA',
      'PENDENTE',
    ]);
  });
});
