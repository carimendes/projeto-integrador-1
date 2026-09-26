import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ cnpj: string }> }
) {
  const { cnpj } = await params;
  const cleanCnpj = cnpj.replace(/\D/g, "");

  if (cleanCnpj.length !== 14) {
    return NextResponse.json(
      { message: "CNPJ inválido" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`,
      {
        headers: {
          "Content-Type": "application/json",
          // Adicionar o User-Agent é fundamental para evitar o 403 Forbidden
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        next: { revalidate: 86400 }, // Cache de 24h
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { message: "CNPJ não encontrado na BrasilAPI" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro ao consultar BrasilAPI:", error);
    return NextResponse.json(
      { message: "Erro ao buscar dados do CNPJ" },
      { status: 500 }
    );
  }
}