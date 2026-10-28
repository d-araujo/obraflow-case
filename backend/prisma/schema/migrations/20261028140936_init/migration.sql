-- CreateEnum
CREATE TYPE "status_pedido" AS ENUM ('PENDENTE', 'APROVADO', 'REJEITADO');

-- CreateEnum
CREATE TYPE "status_etapa" AS ENUM ('PENDENTE', 'APROVADA', 'REJEITADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "unidade" AS ENUM ('UN', 'KG', 'M', 'M2', 'M3', 'H');

-- CreateTable
CREATE TABLE "aprovadores_faixa" (
    "id" SERIAL NOT NULL,
    "faixa_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "aprovadores_faixa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "etapas" (
    "id" SERIAL NOT NULL,
    "pedido_id" INTEGER NOT NULL,
    "ordem" INTEGER NOT NULL,
    "aprovador_id" INTEGER NOT NULL,
    "status" "status_etapa" NOT NULL DEFAULT 'PENDENTE',
    "motivo" TEXT,
    "decidida_em" TIMESTAMP(3),

    CONSTRAINT "etapas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faixas" (
    "id" SERIAL NOT NULL,
    "obra_id" INTEGER NOT NULL,
    "limite_maximo" DECIMAL(14,2),

    CONSTRAINT "faixas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fornecedores" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,

    CONSTRAINT "fornecedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens" (
    "id" SERIAL NOT NULL,
    "pedido_id" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "quantidade" DECIMAL(12,3) NOT NULL,
    "unidade" "unidade" NOT NULL,
    "preco_unitario" DECIMAL(14,2) NOT NULL,
    "total" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "obras" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "obras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" SERIAL NOT NULL,
    "obra_id" INTEGER NOT NULL,
    "fornecedor_id" INTEGER NOT NULL,
    "data_pedido" DATE NOT NULL,
    "observacoes" TEXT,
    "total" DECIMAL(14,2) NOT NULL,
    "status" "status_pedido" NOT NULL DEFAULT 'PENDENTE',
    "etapa_atual" INTEGER,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "aprovadores_faixa_usuario_id_idx" ON "aprovadores_faixa"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "aprovadores_faixa_faixa_id_ordem_key" ON "aprovadores_faixa"("faixa_id", "ordem");

-- CreateIndex
CREATE UNIQUE INDEX "aprovadores_faixa_faixa_id_usuario_id_key" ON "aprovadores_faixa"("faixa_id", "usuario_id");

-- CreateIndex
CREATE INDEX "etapas_aprovador_id_status_idx" ON "etapas"("aprovador_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "etapas_pedido_id_ordem_key" ON "etapas"("pedido_id", "ordem");

-- CreateIndex
CREATE UNIQUE INDEX "faixas_obra_id_limite_maximo_key" ON "faixas"("obra_id", "limite_maximo");

-- Índice parcial (não expressável no schema Prisma): no máximo uma faixa sem teto por obra.
CREATE UNIQUE INDEX "faixas_obra_sem_teto_key" ON "faixas"("obra_id") WHERE "limite_maximo" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "fornecedores_cnpj_key" ON "fornecedores"("cnpj");

-- CreateIndex
CREATE INDEX "itens_pedido_id_idx" ON "itens"("pedido_id");

-- CreateIndex
CREATE INDEX "pedidos_status_idx" ON "pedidos"("status");

-- CreateIndex
CREATE INDEX "pedidos_obra_id_idx" ON "pedidos"("obra_id");

-- CreateIndex
CREATE INDEX "pedidos_fornecedor_id_idx" ON "pedidos"("fornecedor_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- AddForeignKey
ALTER TABLE "aprovadores_faixa" ADD CONSTRAINT "aprovadores_faixa_faixa_id_fkey" FOREIGN KEY ("faixa_id") REFERENCES "faixas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aprovadores_faixa" ADD CONSTRAINT "aprovadores_faixa_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etapas" ADD CONSTRAINT "etapas_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etapas" ADD CONSTRAINT "etapas_aprovador_id_fkey" FOREIGN KEY ("aprovador_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faixas" ADD CONSTRAINT "faixas_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "obras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens" ADD CONSTRAINT "itens_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "obras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
