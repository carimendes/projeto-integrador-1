import { describe, expect, it } from "vitest";
import {
  validarEstoqueMinimoOpcional,
  validarMovimentacao,
  validarPreferencias,
  validarProduto,
} from "@/lib/validacoes";

/*
  Mensagens de validação em linguagem simples (seção 3.8 do relatório).
  Cada erro precisa dizer o campo, para o front-end mostrar a mensagem ao
  lado dele.
*/

const movimentacaoValida = {
  id_produto: "0b6f1c1e-0000-4000-8000-000000000001",
  tipo_movimento: "ENTRADA",
  quantidade: "10",
  id_fornecedor: "",
  motivacao: "  Compra  ",
  referencia_externa: "",
};

describe("Validação de movimentações", () => {
  it("aceita uma entrada válida e limpa os campos vazios", () => {
    const r = validarMovimentacao(movimentacaoValida);
    expect(r).toEqual({
      ok: true,
      dados: {
        id_produto: movimentacaoValida.id_produto,
        tipo_movimento: "ENTRADA",
        quantidade: 10,
        id_fornecedor: null,
        motivacao: "Compra",
        referencia_externa: null,
      },
    });
  });

  it.each([
    [{ quantidade: "0" }, "quantidade", "A quantidade deve ser maior que zero."],
    [{ quantidade: "-5" }, "quantidade", "A quantidade deve ser maior que zero."],
    [{ quantidade: "" }, "quantidade", "Informe a quantidade."],
    [{ quantidade: "2,5" }, "quantidade", "A quantidade deve ser um número inteiro, sem vírgula ou ponto."],
    [{ quantidade: "abc" }, "quantidade", "A quantidade deve ser um número inteiro, sem vírgula ou ponto."],
    [{ id_produto: "" }, "id_produto", "Selecione o produto."],
    [
      { tipo_movimento: "TRANSFERENCIA" },
      "tipo_movimento",
      "Selecione o tipo de movimentação: entrada, saída ou ajuste.",
    ],
    [
      { referencia_externa: "x".repeat(101) },
      "referencia_externa",
      "A referência externa pode ter no máximo 100 caracteres.",
    ],
  ])("rejeita %j com mensagem clara", (alteracao, campo, mensagem) => {
    expect(validarMovimentacao({ ...movimentacaoValida, ...alteracao })).toEqual({
      ok: false,
      campo,
      mensagem,
    });
  });

  it("saída também exige quantidade positiva (antes, -5 aumentava o estoque)", () => {
    const r = validarMovimentacao({ ...movimentacaoValida, tipo_movimento: "SAIDA", quantidade: -5 });
    expect(r).toMatchObject({ ok: false, campo: "quantidade" });
  });

  it("ajuste aceita número negativo, mas não zero", () => {
    expect(
      validarMovimentacao({ ...movimentacaoValida, tipo_movimento: "AJUSTE", quantidade: "-3" }),
    ).toMatchObject({ ok: true, dados: { quantidade: -3 } });
    expect(
      validarMovimentacao({ ...movimentacaoValida, tipo_movimento: "AJUSTE", quantidade: "0" }),
    ).toMatchObject({ ok: false, campo: "quantidade" });
  });
});

describe("Validação de produtos (estoque mínimo)", () => {
  const produto = {
    sku: "BOB-01",
    nome: "Bobina 40cm",
    tipo_bobina: "SIMPLES",
    largura: "40",
    gramatura: "60",
    quantidade_estoque: "10",
    estoque_minimo: "",
  };

  it("estoque mínimo em branco vira 0 (sem acompanhamento)", () => {
    expect(validarProduto(produto)).toMatchObject({ ok: true, dados: { estoque_minimo: 0 } });
  });

  it("aceita estoque mínimo informado", () => {
    expect(validarProduto({ ...produto, estoque_minimo: "20" })).toMatchObject({
      ok: true,
      dados: { estoque_minimo: 20 },
    });
  });

  it("rejeita estoque mínimo negativo com mensagem clara", () => {
    expect(validarProduto({ ...produto, estoque_minimo: "-1" })).toEqual({
      ok: false,
      campo: "estoque_minimo",
      mensagem: "O estoque mínimo não pode ser negativo.",
    });
  });

  it("na atualização, estoque mínimo ausente significa 'não alterar'", () => {
    expect(validarEstoqueMinimoOpcional(undefined)).toEqual({ ok: true, dados: undefined });
    expect(validarEstoqueMinimoOpcional(15)).toEqual({ ok: true, dados: 15 });
    expect(validarEstoqueMinimoOpcional("x")).toMatchObject({ ok: false, campo: "estoque_minimo" });
  });
});

describe("Validação das preferências de acessibilidade", () => {
  it("aceita os valores permitidos", () => {
    expect(validarPreferencias({ tamanhoFonte: "muito_grande", altoContraste: true })).toEqual({
      ok: true,
      dados: { tamanhoFonte: "muito_grande", altoContraste: true },
    });
  });

  it("rejeita tamanho de fonte desconhecido", () => {
    expect(validarPreferencias({ tamanhoFonte: "enorme", altoContraste: false })).toMatchObject({
      ok: false,
      campo: "tamanhoFonte",
    });
  });

  it("rejeita alto contraste que não seja verdadeiro/falso", () => {
    expect(validarPreferencias({ tamanhoFonte: "normal", altoContraste: "sim" })).toMatchObject({
      ok: false,
      campo: "altoContraste",
    });
  });
});
