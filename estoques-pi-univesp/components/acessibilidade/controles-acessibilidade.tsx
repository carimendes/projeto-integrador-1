"use client";

import { Accessibility } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { ehTamanhoFonte, TAMANHOS_FONTE, type TamanhoFonte } from "@/lib/validacoes";
import { usePreferencias } from "./preferencias-provider";

const ROTULOS_FONTE: Record<TamanhoFonte, string> = {
  normal: "Normal",
  grande: "Grande",
  muito_grande: "Muito grande",
};

/*
  Botão "Acessibilidade" do topo da tela: abre um painel para escolher o
  tamanho do texto e ligar o alto contraste. Tudo funciona pelo teclado
  (Tab, setas, Espaço, Esc para fechar).
*/
export function ControlesAcessibilidade() {
  const { preferencias, alterar } = usePreferencias();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="cursor-pointer">
          <Accessibility className="mr-2 size-4" />
          Acessibilidade
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72" aria-label="Opções de acessibilidade">
        <div className="flex flex-col gap-5">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-semibold">Tamanho do texto</legend>
            <RadioGroup
              value={preferencias.tamanhoFonte}
              onValueChange={(valor) => ehTamanhoFonte(valor) && alterar({ tamanhoFonte: valor })}
              className="gap-2"
            >
              {TAMANHOS_FONTE.map((tamanho) => (
                <div key={tamanho} className="flex items-center gap-2">
                  <RadioGroupItem id={`fonte-${tamanho}`} value={tamanho} />
                  <Label htmlFor={`fonte-${tamanho}`} className="cursor-pointer font-normal">
                    {ROTULOS_FONTE[tamanho]}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </fieldset>

          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="alto-contraste" className="cursor-pointer text-sm font-semibold">
              Alto contraste
            </Label>
            <Switch
              id="alto-contraste"
              checked={preferencias.altoContraste}
              onCheckedChange={(ligado) => alterar({ altoContraste: ligado })}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Suas escolhas ficam salvas na sua conta e neste navegador.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
