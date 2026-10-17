import { AlertCircle } from "lucide-react";

/*
  Mensagem de erro mostrada logo abaixo de um campo de formulário.

  - role="alert": o leitor de tela anuncia a mensagem assim que ela aparece.
  - Ícone + texto: o erro não depende só da cor vermelha.
  - O campo deve apontar para esta mensagem com aria-describedby={idErro(campo)}
    e ter aria-invalid="true", para o leitor de tela ler o erro junto com o campo.
*/

export const idErro = (campo: string) => `${campo}-erro`;

export interface ErroFormulario {
  mensagem: string;
  campo?: string;
}

/** Props de acessibilidade para colocar no campo (Input, SelectTrigger...). */
export function propsCampo(campo: string, erro: ErroFormulario | null) {
  const comErro = erro?.campo === campo;
  return {
    "aria-invalid": comErro || undefined,
    "aria-describedby": comErro ? idErro(campo) : undefined,
  };
}

export function MensagemErroCampo({ campo, erro }: { campo: string; erro: ErroFormulario | null }) {
  if (!erro || erro.campo !== campo) return null;
  return (
    <p id={idErro(campo)} role="alert" className="flex items-start gap-1.5 text-sm font-medium text-destructive">
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <span>{erro.mensagem}</span>
    </p>
  );
}

/** Lê a mensagem de erro padronizada da API ({ error, campo }). */
export async function lerErroResposta(resposta: Response, padrao: string): Promise<ErroFormulario> {
  const corpo = await resposta.json().catch(() => null);
  return {
    mensagem: typeof corpo?.error === "string" ? corpo.error : padrao,
    campo: typeof corpo?.campo === "string" ? corpo.campo : undefined,
  };
}

/** Leva o foco do teclado para o campo com erro, para a pessoa corrigir direto. */
export function focarCampo(campo: string | undefined) {
  if (!campo) return;
  // espera o React mostrar a mensagem antes de mover o foco
  requestAnimationFrame(() => document.getElementById(campo)?.focus());
}
