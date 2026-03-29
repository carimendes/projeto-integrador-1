-- usuário: estoques
-- senha: univesp123!

-- =============================================
-- 1. EXTENSÕES NECESSÁRIAS
-- =============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 2. TABELAS PRINCIPAIS
-- =============================================

-- Fornecedores
CREATE TABLE fornecedores (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome        VARCHAR(150) NOT NULL,
    contato     VARCHAR(100),
    email       VARCHAR(150),
    telefone    VARCHAR(30),
    notas       TEXT,
    esta_ativo   BOOLEAN NOT NULL DEFAULT true,
    data_criacao  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_atualizacao  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Usuários (para auditoria de quem fez as movimentações)
CREATE TABLE usuarios (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email       VARCHAR(150) NOT NULL UNIQUE,
    senha       TEXT NOT NULL,
    nome        VARCHAR(100),
    esta_ativo   BOOLEAN NOT NULL DEFAULT true,
    data_criacao  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_atualizacao  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Produtos
CREATE TABLE produtos (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku              VARCHAR(50) NOT NULL UNIQUE,           -- código único de mercado do produto
    nome          VARCHAR(200) NOT NULL,
    tipo_bobina   VARCHAR(20) NOT NULL CHECK (tipo_bobina_papel IN ('SIMPLES', 'ESTAMPADA')),
    largura     INTEGER NOT NULL,
    gramatura   INTEGER NOT NULL,
    url_foto     TEXT,
    esta_ativo     BOOLEAN NOT NULL DEFAULT true,
    data_criacao    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_atualizacao    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    quantidade_estoque    INTEGER NOT NULL DEFAULT 0 CHECK (quantidade_estoque >= 0)
);

-- Movimentações de estoque (histórico completo e auditável)
CREATE TABLE movimentacoes_estoque (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_movimento   VARCHAR(20) NOT NULL CHECK (tipo_movimento IN ('ENTRADA', 'SAIDA', 'AJUSTE')),
    id_produto      UUID REFERENCES produtos(id) ON DELETE SET NULL,
    quantidade        INTEGER NOT NULL CHECK (quantidade != 0),   -- positivo para ENTRADA/AJUSTE+, negativo para SAIDA/AJUSTE-
    motivacao          TEXT,                                     -- "Compra fornecedor X", "Venda pedido #123", "Inventário físico", etc.
    id_fornecedor     UUID REFERENCES fornecedores(id) ON DELETE SET NULL,
    referencia_externa    VARCHAR(100),                  -- ID do pedido na Shopee, número da nota, etc.
    id_usuario         UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    data_criacao      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);