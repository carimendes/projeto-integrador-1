# Testes — Análise de Dados e Acessibilidade

Este documento cobre os testes dos módulos das seções 3.7 (Análise de Dados) e 3.8 (Acessibilidade) do relatório. Ele tem duas partes:

1. **Testes automáticos**, que rodam com um comando.
2. **Roteiro de testes manuais**, feitos com Lighthouse, WAVE, teclado e NVDA.

## 1. Testes automáticos

### Como rodar

```bash
pnpm install
pnpm test
```

Sem banco configurado, os testes de banco aparecem como *skipped* e o restante roda normalmente.

Para rodar **também** os testes de banco, aponte `TEST_DATABASE_URL` para um PostgreSQL vazio. Pode ser local ou um *branch* de testes no Neon.

```bash
TEST_DATABASE_URL=postgresql://postgres@localhost:5432/estoques_teste pnpm test
```

Os testes criam um schema temporário, rodam `construcao-bd.sql` e `002-analise-acessibilidade.sql` e apagam tudo no final. **Não use o banco de produção.**

### O que cada arquivo verifica

| Arquivo | O que testa |
|---|---|
| `tests/banco/analise.test.ts` | Valores de cada gráfico e da tabela de estoque mínimo, num banco PostgreSQL de verdade, nos três períodos (30 dias, 6 meses, 1 ano). Inclui: virada de mês no fuso de São Paulo; ajustes que não contam como entrada/saída; produto inativo; produto exatamente no mínimo; saída gravada com sinal negativo; movimentos futuros. **Conferência do relatório:** soma dos gráficos = soma direta em SQL na tabela. Testa também as restrições da migração 002 e se ela pode rodar duas vezes. |
| `tests/api/rotas.test.ts` | `GET /api/analise` bloqueia quem não está logado (401) e rejeita período inválido. Erros do banco viram mensagem simples, sem detalhe técnico. `/api/preferencias` exige login, salva e valida. Mensagens de erro da movimentação ("A quantidade deve ser maior que zero."). |
| `tests/unidade/periodo.test.ts` | Datas de início dos três períodos, inclusive na virada de mês do fuso. Nomes dos meses em português. |
| `tests/unidade/validacoes.test.ts` | Todas as mensagens de validação em linguagem simples (movimentação, produto/estoque mínimo, preferências). |
| `tests/componentes/analise.test.tsx` | Regras automáticas de acessibilidade (axe-core, o mesmo motor do Lighthouse) nos gráficos, na tabela e no filtro. Descrição do gráfico para leitor de tela. Tabela com os mesmos valores. Destaque de "abaixo do mínimo" que não depende só da cor. Filtro operado pelo teclado. |
| `tests/componentes/acessibilidade.test.tsx` | Painel de acessibilidade aberto pelo teclado. Fonte e alto contraste aplicados e salvos (navegador e conta). Preferências da conta aplicadas ao entrar. Atalho "Pular para o conteúdo principal". `aria-current` no menu. Erro de formulário lido junto com o campo. |

> O axe-core não verifica **contraste de cores** nos testes automáticos, porque o jsdom não calcula cores. O contraste é verificado no roteiro manual abaixo (Lighthouse e WAVE).

## 2. Roteiro de testes manuais

Faça cada teste com o sistema rodando (`pnpm dev`) e logado. Repita com **alto contraste ligado** e com **fonte "Muito grande"**.

Telas: Login, Dashboard, Estoque, Novo Produto, Movimentações, **Análise de Dados**, Fornecedores, Usuários.

### 2.1 Lighthouse (Chrome)

1. Abra a tela, aperte F12 e vá na aba **Lighthouse**.
2. Marque só **Accessibility**, escolha *Desktop* e clique em **Analyze page load**.
3. Anote a nota e cada item reprovado.

**Meta:** nota ≥ 90 em todas as telas e nenhum item de contraste reprovado.

### 2.2 WAVE

1. Instale a extensão WAVE (wave.webaim.org/extension) e abra a tela.
2. Clique no ícone do WAVE.
3. Anote os **Errors** e **Contrast Errors**. Os *Alerts* devem ser lidos, mas nem todos são problemas.

**Meta:** 0 erros e 0 erros de contraste.

### 2.3 Só teclado (sem mouse)

| # | Passo | Esperado |
|---|---|---|
| 1 | Na Análise de Dados, aperte **Tab** uma vez | Aparece "Pular para o conteúdo principal"; Enter leva ao título da página |
| 2 | Continue com Tab por toda a página | O foco sempre aparece (contorno azul grosso) e segue a ordem visual |
| 3 | No filtro de período, use **setas ← →** | O período muda e os gráficos recarregam |
| 4 | Em "Ver dados em tabela", aperte **Enter** | A tabela abre e fecha |
| 5 | No botão **Acessibilidade**, Enter → setas → Espaço → **Esc** | Abre o painel, escolhe o tamanho, liga o contraste e fecha voltando o foco ao botão |
| 6 | Em Movimentações, envie com quantidade 0 | A mensagem aparece abaixo do campo e o foco vai para o campo |

### 2.4 Leitor de tela NVDA (Windows, gratuito)

1. Instale o NVDA (nvaccess.org) e abra o Chrome.
2. Use **H** para pular entre títulos, **D** para regiões e **T** para tabelas.

| # | Onde | Esperado |
|---|---|---|
| 1 | Menu lateral | Lê "Menu principal" e "Análise de Dados, página atual" |
| 2 | Cada gráfico | Lê a descrição em texto (ex.: "Gráfico de colunas comparando entradas e saídas em 6 meses: …") |
| 3 | Tabelas | Lê cabeçalhos de linha e coluna ao navegar com Ctrl+Alt+setas |
| 4 | Troca de período | Anuncia "Mostrando dados: últimos 30 dias" |
| 5 | Erro de formulário | Anuncia a mensagem na hora e de novo ao focar o campo |
| 6 | Produtos abaixo do mínimo | Cada linha lê "Abaixo do mínimo" |

### 2.5 Testar a rota da análise (Postman / Thunder Client)

| Requisição | Esperado |
|---|---|
| `GET /api/analise?periodo=6m` **sem** estar logado | Não devolve dados (o `middleware.ts` redireciona para a tela de login) |
| `GET /api/analise?periodo=6m` com o cookie de sessão | 200 com `entradasSaidasPorMes`, `maisSaidas`, `entradasPorFornecedor`, `estoqueAtual`, `abaixoDoMinimo` |
| `GET /api/analise?periodo=2anos` logado | 400 com `{ "error": "Período inválido. …", "campo": "periodo" }` |

Para a requisição logada, copie o cookie `next-auth.session-token` do navegador (F12 → Application → Cookies) e envie-o no Postman.

### 2.6 Conferir um gráfico com SQL (no console do Neon)

```sql
-- Entradas e saídas por mês dos últimos 6 meses (deve bater com o gráfico)
SELECT to_char(date_trunc('month', data_criacao AT TIME ZONE 'America/Sao_Paulo'), 'YYYY-MM') AS mes,
       SUM(ABS(quantidade)) FILTER (WHERE tipo_movimento = 'ENTRADA') AS entradas,
       SUM(ABS(quantidade)) FILTER (WHERE tipo_movimento = 'SAIDA')   AS saidas
FROM movimentacoes_estoque
WHERE data_criacao >= date_trunc('month', NOW() AT TIME ZONE 'America/Sao_Paulo') - INTERVAL '5 months'
GROUP BY 1 ORDER BY 1;
```

Depois, registre uma movimentação nova e confira se o gráfico muda ao recarregar a página.

## Registro dos resultados (para o relatório)

| Data | Tela | Ferramenta | Resultado | Problema encontrado | Corrigido? |
|---|---|---|---|---|---|
| | | | | | |
