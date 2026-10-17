/*
  Validação dos dados recebidos pelas rotas de API, com mensagens em
  linguagem simples (seção 3.8 — Acessibilidade).

  Cada função devolve:
    { ok: true, dados }                 → dados já limpos e convertidos
    { ok: false, mensagem, campo }      → erro para mostrar ao lado do campo
*/

export type ResultadoValidacao<T> =
  | { ok: true; dados: T }
  | { ok: false; mensagem: string; campo: string };

const falha = (campo: string, mensagem: string) =>
  ({ ok: false, campo, mensagem }) as const;

type Corpo = Record<string, unknown>;

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : valor == null ? "" : String(valor).trim();
}

function textoOuNulo(valor: unknown): string | null {
  const t = texto(valor);
  return t === "" ? null : t;
}

/** Converte para inteiro. "" / null / undefined → null (vazio). Valor inválido → NaN. */
function inteiro(valor: unknown): number | null {
  if (valor === null || valor === undefined) return null;
  const t = texto(valor);
  if (t === "") return null;
  if (!/^-?\d+$/.test(t)) return Number.NaN;
  return Number(t);
}

// ---------------------------------------------------------------------------
// Movimentações de estoque
// ---------------------------------------------------------------------------

export const TIPOS_MOVIMENTO = ["ENTRADA", "SAIDA", "AJUSTE"] as const;
export type TipoMovimento = (typeof TIPOS_MOVIMENTO)[number];

export interface DadosMovimentacao {
  tipo_movimento: TipoMovimento;
  id_produto: string;
  quantidade: number;
  id_fornecedor: string | null;
  motivacao: string | null;
  referencia_externa: string | null;
}

export function validarMovimentacao(corpo: Corpo): ResultadoValidacao<DadosMovimentacao> {
  const idProduto = texto(corpo.id_produto);
  if (!idProduto) return falha("id_produto", "Selecione o produto.");

  const tipo = texto(corpo.tipo_movimento).toUpperCase();
  if (!(TIPOS_MOVIMENTO as readonly string[]).includes(tipo)) {
    return falha("tipo_movimento", "Selecione o tipo de movimentação: entrada, saída ou ajuste.");
  }

  const quantidade = inteiro(corpo.quantidade);
  if (quantidade === null) return falha("quantidade", "Informe a quantidade.");
  if (Number.isNaN(quantidade)) {
    return falha("quantidade", "A quantidade deve ser um número inteiro, sem vírgula ou ponto.");
  }
  if (tipo === "AJUSTE") {
    if (quantidade === 0) {
      return falha(
        "quantidade",
        "No ajuste, a quantidade não pode ser zero. Use um número negativo para diminuir o estoque.",
      );
    }
  } else if (quantidade <= 0) {
    return falha("quantidade", "A quantidade deve ser maior que zero.");
  }

  const referencia = textoOuNulo(corpo.referencia_externa);
  if (referencia && referencia.length > 100) {
    return falha("referencia_externa", "A referência externa pode ter no máximo 100 caracteres.");
  }

  return {
    ok: true,
    dados: {
      tipo_movimento: tipo as TipoMovimento,
      id_produto: idProduto,
      quantidade,
      id_fornecedor: textoOuNulo(corpo.id_fornecedor),
      motivacao: textoOuNulo(corpo.motivacao),
      referencia_externa: referencia,
    },
  };
}

// ---------------------------------------------------------------------------
// Produtos
// ---------------------------------------------------------------------------

export interface DadosProduto {
  sku: string;
  nome: string;
  tipo_bobina: string;
  largura: number;
  gramatura: number;
  quantidade_estoque: number;
  estoque_minimo: number;
}

export function validarProduto(corpo: Corpo): ResultadoValidacao<DadosProduto> {
  const sku = texto(corpo.sku);
  if (!sku) return falha("sku", "Informe o SKU do produto.");
  if (sku.length > 50) return falha("sku", "O SKU pode ter no máximo 50 caracteres.");

  const nome = texto(corpo.nome);
  if (!nome) return falha("nome", "Informe o nome do produto.");
  if (nome.length > 200) return falha("nome", "O nome pode ter no máximo 200 caracteres.");

  const tipoBobina = texto(corpo.tipo_bobina);
  if (!tipoBobina) return falha("tipo_bobina", "Selecione o tipo de bobina.");

  const largura = inteiro(corpo.largura);
  if (largura === null || Number.isNaN(largura) || largura <= 0) {
    return falha("largura", "A largura deve ser um número inteiro maior que zero.");
  }

  const gramatura = inteiro(corpo.gramatura);
  if (gramatura === null || Number.isNaN(gramatura) || gramatura <= 0) {
    return falha("gramatura", "A gramatura deve ser um número inteiro maior que zero.");
  }

  const quantidade = inteiro(corpo.quantidade_estoque) ?? 0;
  if (Number.isNaN(quantidade)) {
    return falha("quantidade_estoque", "A quantidade inicial deve ser um número inteiro.");
  }
  if (quantidade < 0) {
    return falha("quantidade_estoque", "A quantidade inicial não pode ser negativa.");
  }

  const minimo = inteiro(corpo.estoque_minimo) ?? 0;
  if (Number.isNaN(minimo)) {
    return falha("estoque_minimo", "O estoque mínimo deve ser um número inteiro.");
  }
  if (minimo < 0) return falha("estoque_minimo", "O estoque mínimo não pode ser negativo.");

  return {
    ok: true,
    dados: {
      sku,
      nome,
      tipo_bobina: tipoBobina,
      largura,
      gramatura,
      quantidade_estoque: quantidade,
      estoque_minimo: minimo,
    },
  };
}

/** Valida só o estoque mínimo em atualizações parciais (PUT). undefined = não alterar. */
export function validarEstoqueMinimoOpcional(
  valor: unknown,
): ResultadoValidacao<number | undefined> {
  if (valor === undefined) return { ok: true, dados: undefined };
  const minimo = inteiro(valor);
  if (minimo === null || Number.isNaN(minimo)) {
    return falha("estoque_minimo", "O estoque mínimo deve ser um número inteiro.");
  }
  if (minimo < 0) return falha("estoque_minimo", "O estoque mínimo não pode ser negativo.");
  return { ok: true, dados: minimo };
}

// ---------------------------------------------------------------------------
// Preferências de acessibilidade
// ---------------------------------------------------------------------------

export const TAMANHOS_FONTE = ["normal", "grande", "muito_grande"] as const;
export type TamanhoFonte = (typeof TAMANHOS_FONTE)[number];

export interface Preferencias {
  tamanhoFonte: TamanhoFonte;
  altoContraste: boolean;
}

export const PREFERENCIAS_PADRAO: Preferencias = {
  tamanhoFonte: "normal",
  altoContraste: false,
};

export function ehTamanhoFonte(valor: unknown): valor is TamanhoFonte {
  return typeof valor === "string" && (TAMANHOS_FONTE as readonly string[]).includes(valor);
}

export function validarPreferencias(corpo: Corpo): ResultadoValidacao<Preferencias> {
  if (!ehTamanhoFonte(corpo.tamanhoFonte)) {
    return falha("tamanhoFonte", "Escolha um tamanho de texto: normal, grande ou muito grande.");
  }
  if (typeof corpo.altoContraste !== "boolean") {
    return falha("altoContraste", "Indique se o modo de alto contraste deve ficar ligado ou desligado.");
  }
  return { ok: true, dados: { tamanhoFonte: corpo.tamanhoFonte, altoContraste: corpo.altoContraste } };
}
