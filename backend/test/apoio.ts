import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configurarApp } from '../src/configurar-app.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

export async function criarApp(): Promise<INestApplication<App>> {
  const modulo = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = modulo.createNestApplication<INestApplication<App>>();
  configurarApp(app);
  // Escutar numa porta real deixa as requisições paralelas do supertest dividirem o mesmo servidor.
  await app.listen(0);
  return app;
}

export async function limparBanco(prisma: PrismaService) {
  if (!process.env.DATABASE_URL?.includes('obraflow_test')) {
    throw new Error('limparBanco só roda no banco de teste.');
  }
  await prisma.$executeRawUnsafe(
    'TRUNCATE etapas, itens, pedidos, aprovadores_faixa, faixas, fornecedores, usuarios, obras RESTART IDENTITY CASCADE',
  );
}

export interface Cenario {
  obraId: number;
  fornecedorId: number;
  usuarioIds: number[];
}

// Obra com uma única faixa sem teto cujos aprovadores são os usuários criados, nessa ordem.
export async function criarCenario(
  app: INestApplication<App>,
  quantidadeAprovadores: number,
): Promise<Cenario> {
  const http = app.getHttpServer();
  const obra = await request(http)
    .post('/obras')
    .send({ nome: 'Obra de teste' })
    .expect(201);
  const fornecedor = await request(http)
    .post('/fornecedores')
    .send({ nome: 'Fornecedor de teste' })
    .expect(201);

  const usuarioIds: number[] = [];
  for (let i = 1; i <= quantidadeAprovadores; i++) {
    const usuario = await request(http)
      .post('/usuarios')
      .send({ nome: `Aprovador ${i}`, email: `aprovador${i}@teste.dev` })
      .expect(201);
    usuarioIds.push(usuario.body.id);
  }

  await request(http)
    .post(`/obras/${obra.body.id}/faixas`)
    .send({ limiteMaximo: null, aprovadorIds: usuarioIds })
    .expect(201);

  return { obraId: obra.body.id, fornecedorId: fornecedor.body.id, usuarioIds };
}

export function corpoDoPedido(cenario: Cenario, itens?: object[]) {
  return {
    obraId: cenario.obraId,
    fornecedorId: cenario.fornecedorId,
    dataPedido: '2026-10-28',
    itens: itens ?? [
      {
        descricao: 'Aço CA-50 10 mm',
        quantidade: '10',
        unidade: 'KG',
        precoUnitario: '8.50',
      },
    ],
  };
}
