/*
  Respostas de erro padronizadas das rotas de API (seção 3.8 — Acessibilidade).

  Toda resposta de erro tem o formato:
    { "error": "<mensagem em linguagem simples>", "campo": "<nome do campo>" }

  - "error": texto curto, sem termos técnicos, que pode ser mostrado direto
    para o usuário (ex.: "A quantidade deve ser maior que zero.").
  - "campo": opcional. Quando presente, o front-end mostra a mensagem logo
    abaixo do campo correspondente do formulário, e o leitor de tela anuncia.
*/
import { NextResponse } from "next/server";

export interface CorpoErro {
  error: string;
  campo?: string;
}

export const MENSAGENS = {
  naoAutenticado: "Sua sessão expirou. Entre novamente para continuar.",
  corpoInvalido: "Não foi possível ler os dados enviados. Recarregue a página e tente de novo.",
  erroInesperado: "Algo deu errado do nosso lado. Tente novamente em alguns instantes.",
} as const;

export function respostaErro(status: number, mensagem: string, campo?: string) {
  const corpo: CorpoErro = campo ? { error: mensagem, campo } : { error: mensagem };
  return NextResponse.json(corpo, { status });
}

export const naoAutenticado = () => respostaErro(401, MENSAGENS.naoAutenticado);

export const erroValidacao = (mensagem: string, campo?: string) =>
  respostaErro(400, mensagem, campo);

export const erroServidor = (mensagem: string = MENSAGENS.erroInesperado) =>
  respostaErro(500, mensagem);

/** Código de erro do PostgreSQL (ex.: "23505" = valor duplicado), quando houver. */
export function codigoErroBanco(erro: unknown): string | undefined {
  if (erro && typeof erro === "object" && "code" in erro) {
    const codigo = (erro as { code?: unknown }).code;
    return typeof codigo === "string" ? codigo : undefined;
  }
  return undefined;
}
