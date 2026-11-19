import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["dono", "coordenacao", "secretaria"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }
  const url = new URL(req.url);
  const unidadeId = url.searchParams.get("unidadeId") ?? undefined;
  const competencia = url.searchParams.get("competencia") ?? undefined;

  const hoje = new Date();
  const atrasadas = await prisma.mensalidade.findMany({
    where: {
      status: { in: ["pendente", "atrasada"] },
      vencimento: { lt: hoje },
      ...(unidadeId ? { unidadeId } : {}),
      ...(competencia ? { competencia } : {}),
    },
    include: { aluno: true, unidade: true },
    orderBy: { vencimento: "asc" },
  });

  const total = atrasadas.reduce((s, m) => s + Number(m.valorFinal), 0);
  return NextResponse.json({ total, quantidade: atrasadas.length, itens: atrasadas });
}
