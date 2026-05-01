export async function listarDadosDashboard() {
    const response = await fetch('/api/dashboard');

    return response.json();
}