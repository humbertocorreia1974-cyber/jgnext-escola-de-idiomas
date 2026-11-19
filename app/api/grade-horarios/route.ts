import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PAPEIS_PERMITIDOS = ["dono", "coordenacao", "secretaria", "professor"];

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role ?? "user";
  if (!PAPEIS_PERMITIDOS.includes(role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const unidadeId = searchParams.get("unidadeId") || undefined;
  const professorId = searchParams.get("professorId") || undefined;
  const diaSemanaRaw = searchParams.get("diaSemana");
  const diaSemana =
    diaSemanaRaw !== null && diaSemanaRaw !== "" ? Number(diaSemanaRaw) : undefined;

  const where: Record<string, unknown> = {};
  if (unidadeId) where.unidadeId = unidadeId;
  if (professorId) where.professorId = professorId;
  if (typeof diaSemana === "number" && !Number.isNaN(diaSemana)) {
    where.horarios = { some: { diaSemana } };
  }

  const turmas = await prisma.turma.findMany({
    where,
    include: {
      curso: { select: { id: true, nome: true, idioma: true } },
      nivel: { select: { id: true, nome: true, ordem: true } },
      unidade: { select: { id: true, nome: true } },
      professor: { select: { id: true, nome: true } },
      horarios: { orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }] },
      _count: { select: { matriculas: true } },
    },
    orderBy: [{ codigo: "asc" }],
  });

  return NextResponse.json({ turmas });
}
