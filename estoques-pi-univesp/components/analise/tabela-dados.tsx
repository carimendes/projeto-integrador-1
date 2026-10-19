import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface ColunaTabela {
  titulo: string;
  numerica?: boolean;
}

interface TabelaDadosProps {
  legenda: string;
  colunas: ColunaTabela[];
  linhas: (string | number)[][];
}

const formatarNumero = new Intl.NumberFormat("pt-BR");

/** Tabela simples com os valores de um gráfico, lida pelos leitores de tela. */
export function TabelaDados({ legenda, colunas, linhas }: TabelaDadosProps) {
  return (
    <Table>
      <TableCaption className="sr-only">{legenda}</TableCaption>
      <TableHeader>
        <TableRow>
          {colunas.map((coluna) => (
            <TableHead key={coluna.titulo} scope="col" className={coluna.numerica ? "text-right" : undefined}>
              {coluna.titulo}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {linhas.map((linha, i) => (
          <TableRow key={i}>
            {linha.map((valor, j) =>
              j === 0 ? (
                <th key={j} scope="row" className="p-2 text-left align-middle font-medium">
                  {valor}
                </th>
              ) : (
                <TableCell key={j} className={colunas[j]?.numerica ? "text-right tabular-nums" : undefined}>
                  {typeof valor === "number" ? formatarNumero.format(valor) : valor}
                </TableCell>
              ),
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
