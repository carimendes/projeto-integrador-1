# projeto-integrador-1
Projeto de um sistema de estoques desenvolvido para a disciplina Projeto Integrador 1 (PI-1) da UNIVESP

## ETAPAS PARA MONTAR O PROJETO LOCALMENTE:

1. Instalar uma instância do PostgreSQL na máquina;
2. Criar um usuário no PostgreSQL com o nome "estoques" (pode-se utilizar outro nome, mas será preciso atualizar as configurações da conexão com o banco de dados);
3. Criar, com esse usuário, um banco de dados com o nome "estoques_db" (pode-se utilizar outro nome, mas novamente será preciso alterar as configurações da conexão com o banco);
4. Rodar dentro desse banco os scripts de criação das tabelas do banco (construcao-bd.sql);
5. Instalar o nvm na máquina, para gerenciar a versão do Node.js que será instalada;
6. Instalar a versão lts latest do Node.js;
7. Instalar o gerenciador de pacotes Node.js "pnpm";
8. No diretório raíz da aplicação, "./estoques-pi-univesp", rodar o comando "pnpm install" para que sejam instaladas todas as dependências do projeto;
9. No mesmo diretório, rodar o comando "pnpm dev" para que a aplicação seja compilada e o servidor Node.js inicie;