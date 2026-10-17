# Módulos de Análise de Dados e Acessibilidade — como integrar

**Autora:** Jéssica Rodrigues de Sales
**Escopo:** seções 3.7 (Análise de Dados) e 3.8 (Acessibilidade) do relatório, as alterações de banco de dados desses módulos e os testes deles.

Este arquivo explica o que mudou, como integrar no repositório principal, como rodar e ver as telas novas e o que fazer no banco (Neon) antes de publicar na Vercel.

---

## 1. O que foi feito

### Análise de Dados (seção 3.7)

- Nova tela **Análise de Dados** no menu (`/analise`), com filtro de período: últimos 30 dias, últimos 6 meses ou último ano.
- Os gráficos e a tabela previstos no relatório:
  - estoque atual por produto;
  - entradas e saídas por mês;
  - produtos com mais saídas;
  - entradas por fornecedor;
  - tabela de produtos abaixo do estoque mínimo.
- Nova rota `GET /api/analise?periodo=30d|6m|1a`, só para usuários logados.
- Campo **Estoque mínimo** no cadastro de produto.

### Acessibilidade (seção 3.8)

- Botão **Acessibilidade** no topo de todas as telas, inclusive no login. Ele permite escolher o tamanho do texto (normal, grande ou muito grande) e ligar o alto contraste.
  - A escolha fica salva na conta (rota `/api/preferencias`) e no navegador.
- Foco do teclado sempre visível e atalho "Pular para o conteúdo principal".
- O menu indica para o leitor de tela qual é a página atual.
- Cada gráfico tem uma descrição em texto e o botão "Ver dados em tabela".
- Mensagens de erro em linguagem simples, mostradas abaixo do campo com problema, nos formulários de movimentação e de produto.

### Banco de dados

| Script | O que faz | Onde rodar |
|---|---|---|
| `scripts-bd/002-analise-acessibilidade.sql` | Adiciona `produtos.estoque_minimo`, `usuarios.tamanho_fonte`, `usuarios.alto_contraste` e índices em `movimentacoes_estoque`. Não apaga nem altera dados. Pode rodar mais de uma vez. | **Em todos os bancos, inclusive o de produção** |
| `scripts-bd/003-dados-exemplo.sql` | Cria fornecedores, bobinas e 12 meses de movimentações de exemplo (SKUs `DEMO-…`). | **Só em banco de teste ou demonstração. Nunca no de produção.** |

### Testes

- 72 testes automáticos na pasta `estoques-pi-univesp/tests`, rodados com `pnpm test`.
- Roteiro de testes manuais (Lighthouse, WAVE, teclado, NVDA) em `estoques-pi-univesp/docs/testes.md`.

---

## 2. Como integrar no repositório principal

As mudanças estão em **4 commits** sobre o último commit da `main` (`e242fff chore: correcao de import`), no arquivo `analise-acessibilidade.patch`.

### Opção A: aplicar o patch (recomendado)

```bash
cd projeto-integrador-1
git checkout main
git pull
git checkout -b feature/analise-acessibilidade
git am caminho/para/analise-acessibilidade.patch
git push -u origin feature/analise-acessibilidade
```

Depois, abra um **pull request** dessa branch para a `main` no GitHub, revise e faça o merge.

Se `git am` der conflito porque a `main` mudou depois do commit `e242fff`:

1. Rode `git am --abort`.
2. Rode `git am -3 caminho/para/analise-acessibilidade.patch`. Ele tenta mesclar sozinho e mostra os arquivos com conflito.
3. Resolva os conflitos e rode `git am --continue`.

### Opção B: copiar os arquivos

O `projeto-integrador-1.zip` tem o projeto inteiro com as mudanças. Dá para copiar as pastas e arquivos listados na seção 5 por cima da sua cópia, mas o patch é mais seguro porque mostra exatamente o que mudou.

---

## 3. Antes de publicar na Vercel

1. No **console SQL do Neon de produção**, rode `scripts-bd/002-analise-acessibilidade.sql`. Sem isso, a tela de análise e as preferências de acessibilidade dão erro, porque as colunas novas não existem.
2. Não rode `003-dados-exemplo.sql` em produção.
   - Para uma demonstração com dados, crie um **branch** no Neon (uma cópia do banco), rode o 003 nele e aponte um ambiente de preview da Vercel para esse branch.
3. Não há variável de ambiente nova. As de sempre continuam iguais: `DB_DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`.

---

## 4. Como rodar e ver localmente

1. Num banco Neon de teste, rode nesta ordem: `construcao-bd.sql`, `002-analise-acessibilidade.sql`.
2. Em `estoques-pi-univesp/`, crie o `.env.local` com as variáveis de sempre, apontando `DB_DATABASE_URL` para o banco de teste.
3. Rode:
   ```bash
   pnpm install
   pnpm dev
   ```
4. Abra http://localhost:3000, crie um usuário em "Cadastre-se" e entre.
5. No Neon, rode `003-dados-exemplo.sql` para ter dados nos gráficos.
6. Para ver as mudanças:
   - **Análise de Dados**: no menu. Troque o período e abra "Ver dados em tabela".
   - **Acessibilidade**: botão no topo. Mude o tamanho do texto e ligue o alto contraste.
   - **Teclado**: aperte Tab logo ao abrir a página.
   - **Mensagens de erro**: em Movimentações, registre uma saída maior que o estoque.
7. Testes:
   ```bash
   pnpm test
   ```
   Os testes de banco só rodam com `TEST_DATABASE_URL` apontando para um PostgreSQL vazio; sem ela, aparecem como *skipped*. Detalhes em `docs/testes.md`.

O pnpm 11 recusa pacotes publicados há menos de 24 horas. O `pnpm-lock.yaml` deste patch já foi ajustado para isso.

---

## 5. Arquivos

**Novos:**

- `scripts-bd/002-analise-acessibilidade.sql`
- `scripts-bd/003-dados-exemplo.sql`
- `app/(paginas-internas)/analise/page.tsx`
- `app/api/analise/route.ts`
- `app/api/preferencias/route.ts`
- `components/analise/*`
- `components/acessibilidade/*`
- `lib/analise/*`
- `lib/validacoes.ts`
- `lib/respostas-api.ts`
- `services/analise/*`
- `tests/*`
- `vitest.config.mts`
- `docs/testes.md`

**Alterados** (atenção no merge, porque outras pessoas podem estar mexendo nestes arquivos):

| Arquivo | Mudança |
|---|---|
| `components/dashboard-layout.tsx` | Item "Análise de Dados" no menu, botão de acessibilidade, atalho de teclado, `aria-current` |
| `app/layout.tsx` | Aplica as preferências de acessibilidade em todas as telas |
| `app/page.tsx` (login) | Botão de acessibilidade |
| `app/globals.css` | Cores dos gráficos, foco visível, tamanhos de fonte e alto contraste (só adições no fim do arquivo) |
| `app/api/produtos/route.ts` e `app/api/produtos/[id]/route.ts` | Campo `estoque_minimo` e mensagens de erro em linguagem simples |
| `app/api/movimentacoes-estoque/route.ts` | Validação com mensagens simples (o POST). O GET não mudou. |
| `app/(paginas-internas)/produtos/novo/page.tsx` e `.../movimentacoes/page.tsx` | Campo de estoque mínimo e erros mostrados abaixo dos campos |
| `services/produtos/produtosService.ts` e `services/movimentacoes/movimentacoesService.ts` | Tipos atualizados |
| `package.json` e `pnpm-lock.yaml` | Bibliotecas de teste (`vitest`, `jsdom`, `@testing-library/*`, `axe-core`) e o script `pnpm test` |
| `README.md` | Passo do script 002 e seção de testes |

---

## 6. Observações para o grupo (fora do meu escopo, não alterei)

Encontrei estes pontos durante os testes. Ficam aqui como sugestão para quem cuida de cada parte:

- **Cadastro de produto não salva.** O formulário oferece os tipos "Kraft", "Offset" e outros, mas o banco só aceita `SIMPLES` e `ESTAMPADA`, por causa do CHECK em `construcao-bd.sql`.
- **Cadastro de fornecedor pelo formulário falha.** O CNPJ vai formatado (18 caracteres) para uma coluna `VARCHAR(14)`. A linha que resolve está comentada em `fornecedores/novo/page.tsx`.
- **Qualquer conta Google consegue entrar.** O login com Google cria automaticamente um usuário ativo.
- **A listagem de usuários expõe senhas.** `GET /api/usuarios` devolve o hash das senhas, porque usa `SELECT *`.
- **Excluir um produto apaga o histórico dele.** As movimentações do produto ficam sem referência. Desativar (`esta_ativo`) preservaria o histórico.
