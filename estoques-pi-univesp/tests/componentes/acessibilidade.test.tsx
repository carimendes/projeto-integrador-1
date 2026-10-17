// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import {
  CHAVE_LOCAL,
  PreferenciasProvider,
  SCRIPT_APLICAR_ANTES,
} from "@/components/acessibilidade/preferencias-provider";
import { ControlesAcessibilidade } from "@/components/acessibilidade/controles-acessibilidade";
import { MensagemErroCampo, propsCampo } from "@/components/acessibilidade/mensagem-erro-campo";
import { violacoesAcessibilidade } from "../apoio/axe";

/*
  Testes do módulo de Acessibilidade (seção 3.8 do relatório):
  preferências de fonte e alto contraste, menu, atalho "pular para o
  conteúdo" e mensagens de erro ligadas aos campos.
*/

vi.mock("next/navigation", () => ({ usePathname: () => "/analise" }));
vi.mock("next-auth/react", () => ({ signOut: vi.fn() }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const { DashboardLayout } = await import("@/components/dashboard-layout");

let chamadas: { url: string; metodo: string; corpo?: unknown }[];

function simularServidor(preferenciasSalvas: unknown) {
  chamadas = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      chamadas.push({
        url,
        metodo: init?.method ?? "GET",
        corpo: init?.body ? JSON.parse(String(init.body)) : undefined,
      });
      const corpo = init?.method === "PUT" ? JSON.parse(String(init.body)) : preferenciasSalvas;
      return new Response(JSON.stringify(corpo), {
        status: corpo ? 200 : 401,
        headers: { "content-type": "application/json" },
      });
    }),
  );
}

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.fonte;
  delete document.documentElement.dataset.contraste;
  vi.unstubAllGlobals();
});

describe("Preferências de fonte e alto contraste", () => {
  it("o painel de acessibilidade não tem violações e abre pelo teclado", async () => {
    simularServidor(null);
    render(
      <PreferenciasProvider>
        <ControlesAcessibilidade />
      </PreferenciasProvider>,
    );

    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Acessibilidade" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");

    const painel = await screen.findByRole("dialog", { name: "Opções de acessibilidade" });
    expect(await violacoesAcessibilidade(painel)).toEqual([]);
    expect(screen.getByRole("radio", { name: "Normal" })).toBeChecked();
  });

  it("escolher 'Grande' e ligar o alto contraste muda a tela e salva", async () => {
    simularServidor(null);
    render(
      <PreferenciasProvider>
        <ControlesAcessibilidade />
      </PreferenciasProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Acessibilidade" }));

    await userEvent.click(await screen.findByRole("radio", { name: "Grande" }));
    expect(document.documentElement.dataset.fonte).toBe("grande");

    await userEvent.click(screen.getByRole("switch", { name: "Alto contraste" }));
    expect(document.documentElement.dataset.contraste).toBe("alto");

    // salvo no navegador...
    expect(JSON.parse(localStorage.getItem(CHAVE_LOCAL)!)).toEqual({
      tamanhoFonte: "grande",
      altoContraste: true,
    });
    // ...e enviado para a conta
    const ultimoPut = chamadas.filter((c) => c.metodo === "PUT").at(-1);
    expect(ultimoPut).toEqual({
      url: "/api/preferencias",
      metodo: "PUT",
      corpo: { tamanhoFonte: "grande", altoContraste: true },
    });
  });

  it("aplica as preferências salvas na conta ao abrir o sistema", async () => {
    simularServidor({ tamanhoFonte: "muito_grande", altoContraste: true });
    render(
      <PreferenciasProvider>
        <span>conteúdo</span>
      </PreferenciasProvider>,
    );
    await vi.waitFor(() => expect(document.documentElement.dataset.fonte).toBe("muito_grande"));
    expect(document.documentElement.dataset.contraste).toBe("alto");
  });

  it("voltar para 'Normal' remove a escala de fonte", async () => {
    localStorage.setItem(CHAVE_LOCAL, JSON.stringify({ tamanhoFonte: "grande", altoContraste: false }));
    document.documentElement.dataset.fonte = "grande";
    simularServidor(null);
    render(
      <PreferenciasProvider>
        <ControlesAcessibilidade />
      </PreferenciasProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Acessibilidade" }));
    await userEvent.click(await screen.findByRole("radio", { name: "Normal" }));
    expect(document.documentElement.dataset.fonte).toBeUndefined();
  });

  it("o script do <head> aplica a preferência antes do React (sem 'piscar')", () => {
    localStorage.setItem(CHAVE_LOCAL, JSON.stringify({ tamanhoFonte: "grande", altoContraste: true }));
    new Function(SCRIPT_APLICAR_ANTES)();
    expect(document.documentElement.dataset.fonte).toBe("grande");
    expect(document.documentElement.dataset.contraste).toBe("alto");
  });

  it("o script do <head> não quebra com valor salvo corrompido", () => {
    localStorage.setItem(CHAVE_LOCAL, "{isso não é json");
    expect(() => new Function(SCRIPT_APLICAR_ANTES)()).not.toThrow();
    expect(document.documentElement.dataset.fonte).toBeUndefined();
  });
});

describe("Estrutura das telas internas", () => {
  it("tem atalho 'Pular para o conteúdo principal' como primeiro item do Tab", async () => {
    simularServidor(null);
    render(
      <PreferenciasProvider>
        <DashboardLayout>
          <h1>Análise de Dados</h1>
        </DashboardLayout>
      </PreferenciasProvider>,
    );
    await userEvent.tab();
    const atalho = screen.getByRole("link", { name: "Pular para o conteúdo principal" });
    expect(atalho).toHaveFocus();
    expect(atalho).toHaveAttribute("href", "#conteudo-principal");
    expect(document.getElementById("conteudo-principal")?.tagName).toBe("MAIN");
  });

  it("o menu indica a página atual (aria-current) e inclui a Análise de Dados", () => {
    simularServidor(null);
    render(
      <PreferenciasProvider>
        <DashboardLayout>
          <h1>Análise de Dados</h1>
        </DashboardLayout>
      </PreferenciasProvider>,
    );
    const menuLateral = screen.getByRole("navigation", { name: "Menu principal" });
    const menuCelular = screen.getByRole("navigation", { name: "Menu inferior" });
    expect(within(menuLateral).getByRole("link", { name: "Análise de Dados" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    // no celular o texto é mais curto para caber na barra inferior
    expect(within(menuCelular).getByRole("link", { name: "Análise" })).toHaveAttribute("aria-current", "page");
    expect(screen.getAllByRole("link", { name: "Estoque" })[0]).not.toHaveAttribute("aria-current");
  });

  it("não tem violações de acessibilidade", async () => {
    simularServidor(null);
    const { container } = render(
      <PreferenciasProvider>
        <DashboardLayout>
          <h1>Análise de Dados</h1>
        </DashboardLayout>
      </PreferenciasProvider>,
    );
    expect(await violacoesAcessibilidade(container)).toEqual([]);
  });
});

describe("Mensagens de erro nos formulários", () => {
  it("o leitor de tela lê o erro junto com o campo", async () => {
    const erro = { campo: "quantidade", mensagem: "A quantidade deve ser maior que zero." };
    const { container } = render(
      <form>
        <label htmlFor="quantidade">Quantidade</label>
        <input id="quantidade" {...propsCampo("quantidade", erro)} />
        <MensagemErroCampo campo="quantidade" erro={erro} />
      </form>,
    );

    const campo = screen.getByRole("textbox", { name: "Quantidade" });
    expect(campo).toHaveAttribute("aria-invalid", "true");
    expect(campo).toHaveAccessibleDescription("A quantidade deve ser maior que zero.");
    expect(screen.getByRole("alert")).toHaveTextContent("A quantidade deve ser maior que zero.");
    expect(await violacoesAcessibilidade(container)).toEqual([]);
  });

  it("não marca como inválido um campo sem erro", () => {
    const erro = { campo: "sku", mensagem: "Informe o SKU do produto." };
    render(
      <form>
        <label htmlFor="nome">Nome</label>
        <input id="nome" {...propsCampo("nome", erro)} />
        <MensagemErroCampo campo="nome" erro={erro} />
      </form>,
    );
    expect(screen.getByRole("textbox", { name: "Nome" })).not.toHaveAttribute("aria-invalid");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
