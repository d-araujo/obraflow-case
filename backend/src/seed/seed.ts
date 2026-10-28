import { NestFactory } from '@nestjs/core';
import { FaixasService } from '../alcada/faixas.service.js';
import { AppModule } from '../app.module.js';
import { FornecedoresService } from '../fornecedores/fornecedores.service.js';
import { Unidade } from '../generated/prisma/enums.js';
import { ObrasService } from '../obras/obras.service.js';
import { PedidosService } from '../pedidos/pedidos.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsuariosService } from '../usuarios/usuarios.service.js';

type Pessoa = 'ana' | 'bruno' | 'carla' | 'diego' | 'elisa';

const USUARIOS: Record<Pessoa, { nome: string; email: string }> = {
  ana: { nome: 'Ana Ribeiro', email: 'ana.ribeiro@obraflow.dev' },
  bruno: { nome: 'Bruno Carvalho', email: 'bruno.carvalho@obraflow.dev' },
  carla: { nome: 'Carla Mendes', email: 'carla.mendes@obraflow.dev' },
  diego: { nome: 'Diego Santos', email: 'diego.santos@obraflow.dev' },
  elisa: { nome: 'Elisa Prado', email: 'elisa.prado@obraflow.dev' },
};

const FORNECEDORES = [
  'Concreto Forte Usinados',
  'Aço Recôncavo Distribuidora',
  'Madeireira Lauro de Freitas',
  'Elétrica Itapuã Materiais',
];

type Item = [string, string, Unidade, string];

type Passo = ['aprovar', Pessoa] | ['rejeitar', Pessoa, string];

interface PedidoDemo {
  obra: number;
  fornecedor: number;
  data: string;
  observacoes?: string;
  itens: Item[];
  decisoes: Passo[];
}

async function semear() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('O seed apaga os dados e não roda em produção.');
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const prisma = app.get(PrismaService);
  const obras = app.get(ObrasService);
  const usuarios = app.get(UsuariosService);
  const fornecedores = app.get(FornecedoresService);
  const faixas = app.get(FaixasService);
  const pedidos = app.get(PedidosService);

  // Recriar do zero é o que torna o seed idempotente: toda execução termina no mesmo estado e nos
  // mesmos ids, que o README usa nos exemplos.
  await prisma.$executeRawUnsafe(
    'TRUNCATE etapas, itens, pedidos, aprovadores_faixa, faixas, fornecedores, usuarios, obras RESTART IDENTITY CASCADE',
  );

  const id = {} as Record<Pessoa, number>;
  for (const [chave, dados] of Object.entries(USUARIOS)) {
    id[chave as Pessoa] = (await usuarios.criar(dados)).id;
  }
  const fornecedorIds: number[] = [];
  for (const nome of FORNECEDORES) {
    fornecedorIds.push((await fornecedores.criar({ nome })).id);
  }

  const aurora = await obras.criar({ nome: 'Residencial Jardim Aurora' });
  const galpao = await obras.criar({ nome: 'Galpão Logístico Simões Filho' });
  await obras.criar({ nome: 'Reforma da Escola Municipal Itinga' });

  await faixas.criar(aurora.id, {
    limiteMaximo: '5000.00',
    aprovadorIds: [id.ana],
  });
  await faixas.criar(aurora.id, {
    limiteMaximo: '50000.00',
    aprovadorIds: [id.bruno],
  });
  await faixas.criar(aurora.id, {
    limiteMaximo: null,
    aprovadorIds: [id.carla, id.diego],
  });

  // Bruno aparece nas duas faixas: acima de R$ 20.000 a cadeia fica Ana → Bruno → Elisa.
  await faixas.criar(galpao.id, {
    limiteMaximo: '20000.00',
    aprovadorIds: [id.ana, id.bruno],
  });
  await faixas.criar(galpao.id, {
    limiteMaximo: null,
    aprovadorIds: [id.bruno, id.elisa],
  });

  const demonstracao: PedidoDemo[] = [
    {
      obra: aurora.id,
      fornecedor: fornecedorIds[0],
      data: '2026-10-01',
      observacoes: 'Concretagem da laje do 3º pavimento, torre B.',
      itens: [
        ['Concreto usinado FCK 30 MPa', '12', Unidade.M3, '545.00'],
        ['Bombeamento com caminhão-lança', '4', Unidade.H, '380.00'],
      ],
      decisoes: [
        ['aprovar', 'ana'],
        ['aprovar', 'bruno'],
      ],
    },
    {
      obra: aurora.id,
      fornecedor: fornecedorIds[3],
      data: '2026-10-06',
      itens: [
        ['Cabo flexível 2,5 mm²', '600', Unidade.M, '2.89'],
        ['Disjuntor bipolar 32 A', '18', Unidade.UN, '42.50'],
      ],
      decisoes: [['aprovar', 'ana']],
    },
    {
      obra: aurora.id,
      fornecedor: fornecedorIds[1],
      data: '2026-10-09',
      observacoes: 'Armação das sapatas e vigas baldrame.',
      itens: [
        ['Vergalhão CA-50 10 mm', '2400', Unidade.KG, '7.85'],
        ['Vergalhão CA-60 5 mm', '850', Unidade.KG, '8.40'],
        ['Arame recozido 18', '60', Unidade.KG, '19.90'],
      ],
      decisoes: [['aprovar', 'ana']],
    },
    {
      obra: aurora.id,
      fornecedor: fornecedorIds[0],
      data: '2026-10-13',
      observacoes: 'Fundação completa do bloco C.',
      itens: [
        ['Estaca hélice contínua Ø 40 cm', '320', Unidade.M, '185.00'],
        ['Concreto usinado FCK 35 MPa', '48', Unidade.M3, '590.00'],
      ],
      decisoes: [
        ['aprovar', 'ana'],
        ['aprovar', 'bruno'],
        [
          'rejeitar',
          'carla',
          'Valor acima do orçamento da fundação. Pedir nova cotação para as estacas.',
        ],
      ],
    },
    {
      obra: galpao.id,
      fornecedor: fornecedorIds[2],
      data: '2026-10-15',
      itens: [
        ['Tábua de pinus 30 cm', '180', Unidade.M, '14.20'],
        ['Compensado resinado 14 mm', '45', Unidade.UN, '96.00'],
      ],
      decisoes: [
        ['aprovar', 'ana'],
        ['aprovar', 'bruno'],
      ],
    },
    {
      obra: galpao.id,
      fornecedor: fornecedorIds[1],
      data: '2026-10-20',
      observacoes: 'Estrutura metálica da cobertura.',
      itens: [
        ['Perfil W 200 x 26,6', '3200', Unidade.KG, '11.30'],
        ['Telha termoacústica 30 mm', '410', Unidade.M2, '89.90'],
      ],
      decisoes: [
        ['aprovar', 'ana'],
        ['aprovar', 'bruno'],
      ],
    },
    {
      obra: galpao.id,
      fornecedor: fornecedorIds[3],
      data: '2026-10-22',
      itens: [['Luminária LED high bay 150 W', '40', Unidade.UN, '389.00']],
      decisoes: [
        [
          'rejeitar',
          'ana',
          'Falta a cotação comparativa com pelo menos dois fornecedores.',
        ],
      ],
    },
    {
      obra: aurora.id,
      fornecedor: fornecedorIds[2],
      data: '2026-10-27',
      observacoes: 'Escoramento e fôrmas das lajes da torre C.',
      itens: [
        ['Pontalete de eucalipto 3 m', '120', Unidade.UN, '18.50'],
        ['Prego 17 x 27', '25', Unidade.KG, '21.90'],
        ['Compensado plastificado 18 mm', '60', Unidade.UN, '135.00'],
      ],
      decisoes: [],
    },
    {
      obra: galpao.id,
      fornecedor: fornecedorIds[2],
      data: '2026-10-28',
      itens: [['Locação de plataforma elevatória', '80', Unidade.H, '145.00']],
      decisoes: [],
    },
  ];

  for (const pedido of demonstracao) {
    const criado = await pedidos.criar({
      obraId: pedido.obra,
      fornecedorId: pedido.fornecedor,
      dataPedido: pedido.data,
      observacoes: pedido.observacoes,
      itens: pedido.itens.map(
        ([descricao, quantidade, unidade, precoUnitario]) => ({
          descricao,
          quantidade,
          unidade,
          precoUnitario,
        }),
      ),
    });
    for (const [tipo, pessoa, motivo] of pedido.decisoes) {
      if (tipo === 'aprovar') await pedidos.aprovar(criado.id, id[pessoa]);
      else await pedidos.rejeitar(criado.id, id[pessoa], motivo);
    }
  }

  const resumo = await prisma.pedido.groupBy({
    by: ['status'],
    _count: true,
    orderBy: { status: 'asc' },
  });
  console.log('Seed concluído.');
  console.log(
    `  ${Object.keys(USUARIOS).length} usuários, ${FORNECEDORES.length} fornecedores, 3 obras (uma sem regras)`,
  );
  for (const { status, _count } of resumo) {
    console.log(`  ${_count} pedido(s) ${status}`);
  }

  await app.close();
}

await semear();
