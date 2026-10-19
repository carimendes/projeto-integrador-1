"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ehPeriodoValido, PERIODOS, ROTULOS_PERIODO, type Periodo } from "@/lib/analise/periodo";

interface FiltroPeriodoProps {
  valor: Periodo;
  aoMudar: (periodo: Periodo) => void;
}

/*
  Filtro de período da Análise de Dados.
  É um grupo de opções (radio) com legenda: funciona com as setas do teclado
  e o leitor de tela anuncia "Período, Últimos 6 meses, selecionado, 2 de 3".
*/
export function FiltroPeriodo({ valor, aoMudar }: FiltroPeriodoProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium">Período</legend>
      <RadioGroup
        value={valor}
        onValueChange={(novo) => ehPeriodoValido(novo) && aoMudar(novo)}
        className="flex flex-wrap gap-2"
      >
        {PERIODOS.map((periodo) => {
          const id = `periodo-${periodo}`;
          return (
            <Label
              key={periodo}
              htmlFor={id}
              className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent"
            >
              <RadioGroupItem id={id} value={periodo} />
              {ROTULOS_PERIODO[periodo]}
            </Label>
          );
        })}
      </RadioGroup>
    </fieldset>
  );
}
