# projeto-integrador-1
Projeto de um sistema de estoques desenvolvido para a disciplina Projeto Integrador 1 (PI-1) da UNIVESP

## ETAPAS PARA MONTAR O PROJETO LOCALMENTE:

1. Instalar uma instância do PostgreSQL na máquina;
2. Criar um usuário no PostgreSQL com o nome "estoques" (pode-se utilizar outro nome, mas será preciso atualizar as configurações da conexão com o banco de dados);
3. Criar, com esse usuário, um banco de dados com o nome "estoques_db" (pode-se utilizar outro nome, mas novamente será preciso alterar as configurações da conexão com o banco);
4. Rodar dentro desse banco os scripts da pasta "scripts-bd", nesta ordem: construcao-bd.sql e depois 002-analise-acessibilidade.sql (colunas do módulo de Análise de Dados e das preferências de acessibilidade). Para testar com dados prontos, rodar também 003-dados-exemplo.sql (NÃO usar no banco de produção);
5. Instalar o nvm na máquina, para gerenciar a versão do Node.js que será instalada;
6. Instalar a versão lts latest do Node.js;
7. Instalar o gerenciador de pacotes Node.js "pnpm";
8. No diretório raíz da aplicação, "./estoques-pi-univesp", rodar o comando "pnpm install" para que sejam instaladas todas as dependências do projeto;
9. No mesmo diretório, rodar o comando "pnpm dev" para que a aplicação seja compilada e o servidor Node.js inicie;

## TESTES

Na pasta "./estoques-pi-univesp", rodar "pnpm test". Os testes de banco do módulo de Análise de Dados precisam da variável TEST_DATABASE_URL apontando para um PostgreSQL vazio. Detalhes e roteiro de testes manuais de acessibilidade em "estoques-pi-univesp/docs/testes.md".
