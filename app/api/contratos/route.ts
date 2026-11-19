import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const contratos = await prisma.contrato.findMany({
    include: { aluno: true, curso: true, unidade: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(contratos);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["dono", "coordenacao", "secretaria"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }
  const body = await req.json();
  const { matriculaId, dataInicio, dataFim, valorTotal, parcelas } = body;
  if (!matriculaId || !dataInicio || !valorTotal) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }
  const matricula = await prisma.matricula.findUnique({
    where: { id: matriculaId },
    include: { turma: true, aluno: true },
  });
  if (!matricula) return NextResponse.json({ error: "Matrícula não encontrada" }, { status: 404 });

  const numero = `CT-${Date.now()}`;
  const contrato = await prisma.contrato.create({
    data: {
      numero,
      matriculaId,
      alunoId: matricula.alunoId,
      unidadeId: matricula.turma.unidadeId,
      cursoId: matricula.turma.cursoId,
      criadoPorId: session.user.id,
      dataInicio: new Date(dataInicio),
      dataFim: dataFim ? new Date(dataFim) : null,
      valorTotal,
      parcelas: parcelas ?? 12,
    },
  });
  return NextResponse.json(contrato, { status: 201 });
}
