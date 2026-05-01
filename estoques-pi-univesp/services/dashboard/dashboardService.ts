export async function listarDadosDashboard() {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard`);

    return response.json();
}