import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["dono", "coordenacao", "secretaria"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }
  const { competencia } = await req.json();
  if (!competencia) return NextResponse.json({ error: "Competência obrigatória" }, { status: 400 });

  const matriculas = await prisma.matricula.findMany({
    where: { status: "ativa" },
    include: { turma: true },
  });

  const [ano, mes] = competencia.split("-").map(Number);
  const vencimento = new Date(ano, mes, 10);

  let geradas = 0;
  for (const m of matriculas) {
    const existente = await prisma.mensalidade.findFirst({
      where: { matriculaId: m.id, competencia },
    });
    if (existente) continue;
    const valor = Number(m.valorMensal);
    const desconto = valor * (m.desconto / 100);
    await prisma.mensalidade.create({
      data: {
        matriculaId: m.id,
        alunoId: m.alunoId,
        unidadeId: m.turma.unidadeId,
        competencia,
        valor,
        desconto,
        valorFinal: valor - desconto,
        vencimento,
      },
    });
    geradas++;
  }
  return NextResponse.json({ ok: true, geradas });
}
