import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ProdutoAbaixoMinimo } from "@/lib/analise/consultas";

interface Props {
  produtos: ProdutoAbaixoMinimo[];
  /** Quantos produtos têm estoque mínimo definido (estoque_minimo > 0). */
  produtosComMinimo: number;
}

/*
  5. Produtos com estoque abaixo da quantidade mínima (tabela com destaque).

  O destaque nunca depende só da cor: cada linha tem ícone e o texto
  "Abaixo do mínimo", e a coluna "Faltam" diz quanto repor.
*/
export function TabelaAbaixoMinimo({ produtos, produtosComMinimo }: Props) {
  return (
    <Card role="region" aria-labelledby="abaixo-minimo-titulo">
      <CardHeader>
        <CardTitle>
          <h2 id="abaixo-minimo-titulo" className="text-base font-semibold">
            Produtos abaixo do estoque mínimo
          </h2>
        </CardTitle>
        <CardDescription>Situação de agora. Use esta lista para planejar a reposição.</CardDescription>
      </CardHeader>
      <CardContent>
        {produtosComMinimo === 0 ? (
          <p className="py-6 text-center text-muted-foreground">
            Nenhum produto tem estoque mínimo definido. Informe o estoque mínimo no cadastro do produto
            para acompanhar a reposição aqui.
          </p>
        ) : produtos.length === 0 ? (
          <p className="flex items-center justify-center gap-2 py-6 text-center">
            <CheckCircle2 className="size-5 text-green-600" />
            Todos os produtos estão com estoque igual ou acima do mínimo.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableCaption className="sr-only">
                {produtos.length === 1
                  ? "1 produto abaixo do estoque mínimo"
                  : `${produtos.length} produtos abaixo do estoque mínimo`}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Produto</TableHead>
                  <TableHead scope="col">SKU</TableHead>
                  <TableHead scope="col" className="text-right">Em estoque</TableHead>
                  <TableHead scope="col" className="text-right">Mínimo</TableHead>
                  <TableHead scope="col" className="text-right">Faltam</TableHead>
                  <TableHead scope="col">Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtos.map((p) => (
                  <TableRow key={p.id} style={{ backgroundColor: "var(--alerta-fundo)" }}>
                    <th
                      scope="row"
                      className="p-2 text-left align-middle font-medium"
                      style={{ borderLeft: "4px solid var(--alerta-borda)" }}
                    >
                      {p.nome}
                    </th>
                    <TableCell>{p.sku}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.quantidade}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.estoqueMinimo}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{p.falta}</TableCell>
                    <TableCell>
                      <span
                        className="inline-flex items-center gap-1 font-medium"
                        style={{ color: "var(--alerta-texto)" }}
                      >
                        <AlertTriangle className="size-4" />
                        Abaixo do mínimo
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
