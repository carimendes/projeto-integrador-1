export async function listarProdutos() {
    const resposta = await fetch('/api/produtos')
    return await resposta.json()
}

export async function criarProduto(dadosProduto: {
  sku: string;
  nome: string;
  tipo_bobina: string;
  largura: string;
  gramatura: string;
  quantidade_estoque: string;
}) {
  const resposta = await fetch("/api/produtos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dadosProduto),
  });

  return resposta;
}
