export async function getTodosUsuarios() {
  const response = await fetch("/api/usuarios");
  return await response.json();
}

export async function alterarStatusUsuario(idUsuario: string, usuarioAtivo: boolean) {
  const response = await fetch(`/api/usuarios/${idUsuario}`, {
    method: 'PUT',
    body: JSON.stringify({'operacao': 'alterar_status', 'esta_ativo': usuarioAtivo})
  });
  return await response.json();
}

export async function removerUsuario(idUsuario: string) {
    const response = await fetch(`/api/usuarios/${idUsuario}`, {
        method: 'DELETE'
    })
    return await response.json();
}

export async function cadastrarUsuario(nome: string, email: string, senha: string) {
  const response = await fetch('api/usuarios', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({nome, email, senha})
  })

  return response;
}