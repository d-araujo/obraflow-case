# ObraFlow — Pedidos de compra com aprovação por alçada

Desafio técnico da ObraFlow (https://github.com/ObraFlow/obraflow-case): cadastro de pedidos de compra
por obra, aprovados por uma cadeia de aprovadores definida por faixas de valor. Prazo: 01/11/2026.

## Stack
- `backend/`: NestJS 12 + Prisma 7 (driver adapter `@prisma/adapter-pg`) + PostgreSQL (Docker).
- `frontend/`: React + Vite + TypeScript (ainda não criado).
- `docker-compose.yml` na raiz: só o Postgres.

## Prisma
- Schema multi-arquivo em `backend/prisma/schema/` (um arquivo por model, enums em `enums.prisma`);
  `generator`/`datasource` em `schema.prisma`; migrations em `backend/prisma/schema/migrations/`.
- URL do banco fica em `backend/prisma.config.ts` (lida do `.env`), não no schema.
- Client gerado em `backend/src/generated/prisma/` → importar de `../generated/prisma/client.js`.
- Tabelas em snake_case no plural (`@@map`), colunas camelCase com `@map` em snake_case.
- Nunca rodar `prisma migrate` sem perguntar ao Davi.
- A migration `init` cria à mão o índice parcial `faixas_obra_sem_teto_key` (no máximo uma faixa sem
  teto por obra), que o schema Prisma não expressa. Em migrations futuras, se o Prisma gerar um
  `DROP INDEX "faixas_obra_sem_teto_key"`, remova essa linha do SQL antes de aplicar.

## Regra de alçada (modelo CUMULATIVO)
- A cadeia é formada pelas faixas da obra em ordem crescente de `limiteMaximo` (null = sem teto, por
  último), até e incluindo a faixa em que o total cai; dentro de cada faixa, pela `ordem`.
- Aprovador repetido mantém só a primeira ocorrência.
- "Até X" inclui X.
- Valor sem faixa aplicável: o pedido não é criado e a API retorna um erro claro.
- A cadeia é copiada para a tabela de etapas na criação do pedido (snapshot); editar regras não afeta
  pedidos existentes.
- Nada é apagado: rejeição vira status.

## Dinheiro
- Sempre `Decimal`, nunca `number`/float no backend.
- Total do item arredondado para 2 casas; total do pedido = soma dos itens.
- O backend recalcula tudo e ignora totais vindos do front.

## Ao gerar qualquer código
Explicar o que foi feito e por quê, em português, em poucas linhas.
