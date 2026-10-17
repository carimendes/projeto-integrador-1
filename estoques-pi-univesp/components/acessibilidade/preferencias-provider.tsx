"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
  ehTamanhoFonte,
  PREFERENCIAS_PADRAO,
  type Preferencias,
} from "@/lib/validacoes";

/*
  Guarda e aplica as preferências de acessibilidade (seção 3.8):
  tamanho da fonte e modo de alto contraste.

  Onde ficam salvas:
  1. No banco (usuarios.tamanho_fonte / usuarios.alto_contraste), para valer
     em qualquer computador em que a pessoa entrar.
  2. No navegador (localStorage), para aplicar já no carregamento da página,
     antes da resposta do servidor, e também na tela de login.

  Como são aplicadas: atributos no <html> (data-fonte e data-contraste),
  que o globals.css usa para trocar tamanhos e cores.
*/

export const CHAVE_LOCAL = "estoques:preferencias-acessibilidade";

interface ContextoPreferencias {
  preferencias: Preferencias;
  alterar: (novas: Partial<Preferencias>) => void;
}

const Contexto = createContext<ContextoPreferencias | null>(null);

export function aplicarNoDocumento({ tamanhoFonte, altoContraste }: Preferencias) {
  const html = document.documentElement;
  if (tamanhoFonte === "normal") delete html.dataset.fonte;
  else html.dataset.fonte = tamanhoFonte;
  if (altoContraste) html.dataset.contraste = "alto";
  else delete html.dataset.contraste;
}

export function lerPreferenciasLocais(): Preferencias {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE_LOCAL) ?? "null");
    if (salvo && ehTamanhoFonte(salvo.tamanhoFonte) && typeof salvo.altoContraste === "boolean") {
      return { tamanhoFonte: salvo.tamanhoFonte, altoContraste: salvo.altoContraste };
    }
  } catch {
    // navegador sem localStorage (modo privado, bloqueado etc.): usa o padrão
  }
  return PREFERENCIAS_PADRAO;
}

function salvarLocal(preferencias: Preferencias) {
  try {
    localStorage.setItem(CHAVE_LOCAL, JSON.stringify(preferencias));
  } catch {
    // sem localStorage: segue valendo só nesta visita
  }
}

/*
  Script que roda antes do React, no <head>, para não "piscar" a tela no
  tamanho/cores padrão antes de aplicar a preferência salva.
*/
export const SCRIPT_APLICAR_ANTES = `(function(){try{var p=JSON.parse(localStorage.getItem(${JSON.stringify(
  CHAVE_LOCAL,
)})||"null");if(!p)return;var h=document.documentElement;if(p.tamanhoFonte&&p.tamanhoFonte!=="normal")h.dataset.fonte=p.tamanhoFonte;if(p.altoContraste===true)h.dataset.contraste="alto";}catch(e){}})();`;

export function PreferenciasProvider({ children }: { children: ReactNode }) {
  // O script do <head> já aplicou no <html> o que está salvo no navegador;
  // aqui o estado começa com esse mesmo valor.
  const [preferencias, setPreferencias] = useState<Preferencias>(() =>
    typeof window === "undefined" ? PREFERENCIAS_PADRAO : lerPreferenciasLocais(),
  );

  useEffect(() => {
    // Busca o que está salvo na conta (se a pessoa estiver logada).
    let ativo = true;
    fetch("/api/preferencias")
      .then((r) => (r.ok && r.headers.get("content-type")?.includes("json") ? r.json() : null))
      .then((doServidor: Preferencias | null) => {
        if (!ativo || !doServidor || !ehTamanhoFonte(doServidor.tamanhoFonte)) return;
        setPreferencias(doServidor);
        aplicarNoDocumento(doServidor);
        salvarLocal(doServidor);
      })
      .catch(() => {
        // sem conexão ou não logado: fica com a preferência do navegador
      });

    return () => {
      ativo = false;
    };
  }, []);

  const alterar = useCallback(
    (novas: Partial<Preferencias>) => {
      const atualizadas = { ...preferencias, ...novas };
      setPreferencias(atualizadas);
      aplicarNoDocumento(atualizadas);
      salvarLocal(atualizadas);
      fetch("/api/preferencias", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(atualizadas),
      }).catch(() => {
        // não logado ou sem conexão: a preferência continua salva no navegador
      });
    },
    [preferencias],
  );

  return <Contexto.Provider value={{ preferencias, alterar }}>{children}</Contexto.Provider>;
}

export function usePreferencias() {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error("usePreferencias precisa estar dentro de <PreferenciasProvider>");
  return contexto;
}
