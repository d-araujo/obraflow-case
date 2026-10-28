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

## PROIBIDO implementar sem pedido explícito do Davi
- A montagem da cadeia de aprovação.
- A lógica de aprovar/rejeitar.
- A trava de concorrência.

Nessas partes, apenas revisar e explicar.

## Ao gerar qualquer código
Explicar o que foi feito e por quê, em português, em poucas linhas.
