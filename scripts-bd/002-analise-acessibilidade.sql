-- =============================================================
-- Migração 002 — Módulo de Análise de Dados e Acessibilidade
-- Rodar DEPOIS de construcao-bd.sql. Pode ser executada mais de
-- uma vez sem erro (IF NOT EXISTS).
-- =============================================================

-- -------------------------------------------------------------
-- 1. ANÁLISE DE DADOS (seção 3.7 do relatório)
-- -------------------------------------------------------------

-- Quantidade mínima desejada em estoque para cada produto.
-- Quando quantidade_estoque < estoque_minimo, o produto aparece
-- na tabela "Produtos abaixo do estoque mínimo".
-- 0 = sem mínimo definido (o produto nunca aparece na tabela).
ALTER TABLE produtos
    ADD COLUMN IF NOT EXISTS estoque_minimo INTEGER NOT NULL DEFAULT 0
        CONSTRAINT produtos_estoque_minimo_check CHECK (estoque_minimo >= 0);

-- Índices para as consultas de agrupamento por período, produto
-- e fornecedor do módulo de análise.
CREATE INDEX IF NOT EXISTS idx_movimentacoes_data
    ON movimentacoes_estoque (data_criacao);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_tipo_data
    ON movimentacoes_estoque (tipo_movimento, data_criacao);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_produto
    ON movimentacoes_estoque (id_produto);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_fornecedor
    ON movimentacoes_estoque (id_fornecedor);

-- -------------------------------------------------------------
-- 2. ACESSIBILIDADE (seção 3.8 do relatório)
-- -------------------------------------------------------------

-- Preferências de acessibilidade de cada usuário, mantidas
-- entre um acesso e outro.
ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS tamanho_fonte VARCHAR(15) NOT NULL DEFAULT 'normal'
        CONSTRAINT usuarios_tamanho_fonte_check
        CHECK (tamanho_fonte IN ('normal', 'grande', 'muito_grande'));

ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS alto_contraste BOOLEAN NOT NULL DEFAULT false;
