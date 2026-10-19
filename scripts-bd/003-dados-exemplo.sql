-- =============================================================
-- Script 003 — DADOS DE EXEMPLO (somente para testes e demonstração)
--
-- Cria 3 fornecedores, 6 bobinas e cerca de 12 meses de entradas,
-- saídas e ajustes, para que a Análise de Dados já tenha o que mostrar.
--
-- Como usar:
--   1. Rode antes: construcao-bd.sql e 002-analise-acessibilidade.sql.
--   2. (Opcional) Cadastre seu usuário no sistema ANTES de rodar este
--      script: as movimentações ficam em nome do primeiro usuário.
--   3. Cole este arquivo inteiro no SQL Editor do Neon e execute.
--
-- As datas são relativas ao dia em que o script roda (últimos 12 meses),
-- então os gráficos sempre têm dados nos três períodos do filtro.
--
-- Pode ser executado de novo: ele apaga os dados de exemplo anteriores
-- (SKUs que começam com "DEMO-" e CNPJs de exemplo) e recria tudo.
-- NÃO rode no banco de produção da microempresa.
-- Para remover os dados de exemplo, rode só a seção 0.
-- =============================================================

BEGIN;

-- -------------------------------------------------------------
-- 0. Limpa dados de exemplo anteriores
-- -------------------------------------------------------------
DELETE FROM movimentacoes_estoque
WHERE id_produto IN (SELECT id FROM produtos WHERE sku LIKE 'DEMO-%');

DELETE FROM produtos WHERE sku LIKE 'DEMO-%';

DELETE FROM fornecedores
WHERE cnpj IN ('90000000000101', '90000000000202', '90000000000303');

-- -------------------------------------------------------------
-- 1. Fornecedores (fictícios — CNPJs não existem)
-- -------------------------------------------------------------
INSERT INTO fornecedores (cnpj, nome, contato, email, telefone, notas) VALUES
  ('90000000000101', 'Papel Sorocaba (exemplo)',   'Marcos', 'vendas@papel-exemplo.com.br',   '(15) 3000-0101', 'Dados de exemplo'),
  ('90000000000202', 'Rolos e Tubos (exemplo)',    'Ana',    'contato@rolos-exemplo.com.br',  '(15) 3000-0202', 'Dados de exemplo'),
  ('90000000000303', 'Estampas Gráfica (exemplo)', 'Paulo',  'pedidos@estampa-exemplo.com.br', '(11) 3000-0303', 'Dados de exemplo');

-- -------------------------------------------------------------
-- 2. Produtos (bobinas). O estoque começa em zero e é calculado
--    no passo 4 a partir das movimentações.
-- -------------------------------------------------------------
INSERT INTO produtos (sku, nome, tipo_bobina, largura, gramatura, quantidade_estoque, estoque_minimo) VALUES
  ('DEMO-SIM-30',  'Bobina Simples 30cm 60g',          'SIMPLES',   30, 60, 0, 0),
  ('DEMO-SIM-40',  'Bobina Simples 40cm 80g',          'SIMPLES',   40, 80, 0, 0),
  ('DEMO-SIM-60',  'Bobina Simples 60cm 80g',          'SIMPLES',   60, 80, 0, 0),
  ('DEMO-EST-NAT', 'Bobina Estampada Natal 40cm',      'ESTAMPADA', 40, 70, 0, 0),
  ('DEMO-EST-FLO', 'Bobina Estampada Floral 40cm',     'ESTAMPADA', 40, 70, 0, 0),
  ('DEMO-EST-KRA', 'Bobina Estampada Kraft 60cm',      'ESTAMPADA', 60, 90, 0, 0);

-- -------------------------------------------------------------
-- 3. Movimentações dos últimos 12 meses
--    Para cada produto e cada mês (k = 0 é o mês mais recente):
--    - 1 ENTRADA (compra do fornecedor), pulando alguns meses
--    - 2 SAÍDAS (vendas na loja e na Shopee); a bobina de Natal
--      vende o dobro em novembro e dezembro
--    - 1 AJUSTE de inventário (-2) a cada 4 meses
-- -------------------------------------------------------------
WITH parametros (sku, ordem, entrada_mensal, saida_base, cnpj_fornecedor) AS (
  VALUES
    ('DEMO-SIM-30',  1, 60, 18, '90000000000101'),
    ('DEMO-SIM-40',  2, 80, 25, '90000000000101'),
    ('DEMO-SIM-60',  3, 40, 12, '90000000000202'),
    ('DEMO-EST-NAT', 4, 50, 10, '90000000000303'),
    ('DEMO-EST-FLO', 5, 35, 11, '90000000000303'),
    ('DEMO-EST-KRA', 6, 30,  8, '90000000000202')
),
base AS (
  SELECT p.id AS id_produto, f.id AS id_fornecedor, par.*, k.k
  FROM parametros par
  JOIN produtos p      ON p.sku  = par.sku
  JOIN fornecedores f  ON f.cnpj = par.cnpj_fornecedor
  CROSS JOIN generate_series(0, 11) AS k(k)
),
usuario AS (
  SELECT id FROM usuarios ORDER BY data_criacao LIMIT 1
),
movimentos AS (
  -- Entradas (não há compra em 1 de cada 4 meses, variando por produto)
  SELECT 'ENTRADA' AS tipo, id_produto, id_fornecedor,
         entrada_mensal + ((k * 3 + ordem) % 4) * 5 AS quantidade,
         'Compra de fornecedor' AS motivacao,
         'NF-' || (1000 + k * 10 + ordem) AS referencia,
         NOW() - make_interval(days => k * 30 + 8, hours => ordem) AS quando
  FROM base
  WHERE (k + ordem) % 4 <> 3

  UNION ALL
  -- Primeira venda do mês (loja física)
  SELECT 'SAIDA', id_produto, NULL,
         saida_base + ((k * 7 + ordem * 3) % 5),
         'Venda na loja',
         'PEDIDO-' || (5000 + k * 20 + ordem),
         NOW() - make_interval(days => k * 30 + 18, hours => ordem)
  FROM base

  UNION ALL
  -- Segunda venda do mês (Shopee)
  SELECT 'SAIDA', id_produto, NULL,
         saida_base + ((k * 5 + ordem) % 4),
         'Venda Shopee',
         'SHOPEE-' || (8000 + k * 20 + ordem),
         NOW() - make_interval(days => k * 30 + 3, hours => ordem)
  FROM base

  UNION ALL
  -- Ajuste de inventário a cada 4 meses
  SELECT 'AJUSTE', id_produto, NULL,
         -2,
         'Inventário físico: bobinas danificadas',
         NULL,
         NOW() - make_interval(days => k * 30 + 12, hours => ordem)
  FROM base
  WHERE k % 4 = 1
)
INSERT INTO movimentacoes_estoque
  (tipo_movimento, id_produto, quantidade, motivacao, id_fornecedor, referencia_externa, id_usuario, data_criacao)
SELECT
  m.tipo,
  m.id_produto,
  -- Natal vende o dobro em novembro e dezembro
  CASE
    WHEN m.tipo = 'SAIDA'
     AND m.id_produto = (SELECT id FROM produtos WHERE sku = 'DEMO-EST-NAT')
     AND EXTRACT(MONTH FROM m.quando AT TIME ZONE 'America/Sao_Paulo') IN (11, 12)
    THEN m.quantidade * 2
    ELSE m.quantidade
  END,
  m.motivacao,
  m.id_fornecedor,
  m.referencia,
  (SELECT id FROM usuario),
  m.quando
FROM movimentos m;

-- -------------------------------------------------------------
-- 4. Estoque atual = soma das movimentações
--    (ENTRADA soma, SAÍDA subtrai, AJUSTE soma com sinal)
-- -------------------------------------------------------------
UPDATE produtos p
SET quantidade_estoque = s.saldo,
    data_atualizacao = NOW()
FROM (
  SELECT id_produto,
         SUM(CASE WHEN tipo_movimento = 'SAIDA' THEN -ABS(quantidade) ELSE quantidade END)::int AS saldo
  FROM movimentacoes_estoque
  GROUP BY id_produto
) s
WHERE s.id_produto = p.id
  AND p.sku LIKE 'DEMO-%';

-- -------------------------------------------------------------
-- 5. Estoque mínimo
--    - 2 produtos ficam ABAIXO do mínimo (aparecem na tabela de reposição)
--    - 3 produtos ficam acima do mínimo
--    - 1 produto fica sem mínimo definido (0)
-- -------------------------------------------------------------
UPDATE produtos SET estoque_minimo = quantidade_estoque + 15
WHERE sku IN ('DEMO-SIM-60', 'DEMO-EST-FLO');

UPDATE produtos SET estoque_minimo = GREATEST(5, quantidade_estoque / 3)
WHERE sku IN ('DEMO-SIM-30', 'DEMO-SIM-40', 'DEMO-EST-NAT');

COMMIT;

-- -------------------------------------------------------------
-- Conferência rápida (rode separado, se quiser)
-- -------------------------------------------------------------
-- SELECT sku, nome, quantidade_estoque, estoque_minimo
-- FROM produtos WHERE sku LIKE 'DEMO-%' ORDER BY sku;
