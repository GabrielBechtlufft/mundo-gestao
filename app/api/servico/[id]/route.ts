import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";
import { atualizarRank } from "@/app/actions/ranking";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const listagem = await prisma.listagem.findUnique({
      where: { id: Number(id) },
      include: { User: { select: { name: true, rankTier: true } } },
    });

    if (!listagem || listagem.status !== "ATIVA") {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    // Recalcula o rank do vendedor antes de retornar
    if (listagem.userId) {
      await atualizarRank(listagem.userId);
      // Re-fetch com rank atualizado
      const atualizado = await prisma.listagem.findUnique({
        where: { id: Number(id) },
        include: { User: { select: { name: true, rankTier: true } } },
      });
      return NextResponse.json(atualizado);
    }

    return NextResponse.json(listagem);
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
