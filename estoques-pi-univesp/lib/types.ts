export interface Produto {
  id: number
  nome: string
  tipoBobina: string
  largura: number
  gramatura: number
  quantidadeEstoque: number
}

export interface Movimentacao {
  id: number
  produtoId: number
  tipo: "entrada" | "saida"
  quantidade: number
  data: string
}

export interface Usuario {
  id: number
  nome: string
  email: string
  senha: string
}
