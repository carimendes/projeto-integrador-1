export async function listarMovimentacoes() {
    const resposta = await fetch('/api/movimentacoes-estoque');
    return await resposta.json();
}

export interface DadosNovaMovimentacao {
    id_produto: string;
    id_fornecedor: string;
    motivacao: string;
    referencia_externa: string;
    tipo_movimento: string;
    quantidade: string;
}

export async function lancarMovimentacao(dadosMovimentacao: DadosNovaMovimentacao) {
    const resposta = await fetch('/api/movimentacoes-estoque', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(dadosMovimentacao)
    })
    return resposta;
}