export async function listarMovimentacoes() {
    const resposta = await fetch('/api/movimentacoes-estoque');
    return await resposta.json();
}

export async function lancarMovimentacao(dadosMovimentacao) {
    const resposta = await fetch('/api/movimentacoes-estoque', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(dadosMovimentacao)
    })
    return resposta;
}