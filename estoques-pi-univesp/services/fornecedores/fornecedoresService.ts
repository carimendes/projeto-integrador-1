export async function listarFornecedores() {
    const response = await fetch('/api/fornecedores')
    return await response.json();
}

export async function cadastrarFornecedor(dadosNovoFornecedor: {nome: string, contato: string, email: string, telefone: string }) {
    const response = await fetch('/api/fornecedores', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(dadosNovoFornecedor)
    })
    return response;
}

export async function removerFornecedor(idFornecedor: string) {
    const response = await fetch(`/api/fornecedores/${idFornecedor}`, {
        method: 'DELETE'
    });
    return await response.json();
}