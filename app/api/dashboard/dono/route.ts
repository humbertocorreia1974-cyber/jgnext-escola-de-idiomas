import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function inicioMes(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function fimMes(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
}
function competenciaAtual(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "dono") {
    return NextResponse.json({ error: "Acesso restrito ao dono." }, { status: 403 });
  }

  const agora = new Date();
  const inicio = inicioMes(agora);
  const fim = fimMes(agora);
  const competencia = competenciaAtual(agora);

  const unidades = await prisma.unidade.findMany({
    where: { ativa: true },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true, cidade: true, uf: true },
  });

  const matriculasMes = await prisma.matricula.findMany({
    where: { dataMatricula: { gte: inicio, lte: fim } },
    select: { id: true, turma: { select: { unidadeId: true } } },
  });

  const matriculasAtivas = await prisma.matricula.findMany({
    where: { status: "ativa" },
    select: { id: true, turma: { select: { unidadeId: true } } },
  });

  const canceladasMes = await prisma.matricula.count({
    where: { status: "cancelada", updatedAt: { gte: inicio, lte: fim } },
  });

  const turmas = await prisma.turma.findMany({
    where: { status: { in: ["aberta", "em_andamento"] } },
    select: {
      id: true,
      capacidade: true,
      unidadeId: true,
      _count: { select: { matriculas: true } },
    },
  });

  const mensalidadesMes = await prisma.mensalidade.findMany({
    where: { competencia },
    select: {
      valorFinal: true,
      status: true,
      unidadeId: true,
      aluno: { select: { unidadeId: true } },
    },
  });

  const inadimplentes = await prisma.mensalidade.findMany({
    where: { status: { in: ["pendente", "atrasada"] }, vencimento: { lt: agora } },
    select: {
      valorFinal: true,
      unidadeId: true,
      aluno: { select: { unidadeId: true } },
    },
  });

  type Agg = {
    unidadeId: string;
    matriculasMes: number;
    matriculasAtivas: number;
    turmas: number;
    vagas: number;
    ocupadas: number;
    receitaPrevista: number;
    receitaRecebida: number;
    inadimplencia: number;
  };

  const porUnidade = new Map<string, Agg>();
  for (const u of unidades) {
    porUnidade.set(u.id, {
      unidadeId: u.id,
      matriculasMes: 0,
      matriculasAtivas: 0,
      turmas: 0,
      vagas: 0,
      ocupadas: 0,
      receitaPrevista: 0,
      receitaRecebida: 0,
      inadimplencia: 0,
    });
  }

  for (const m of matriculasMes) {
    const a = porUnidade.get(m.turma.unidadeId);
    if (a) a.matriculasMes += 1;
  }
  for (const m of matriculasAtivas) {
    const a = porUnidade.get(m.turma.unidadeId);
    if (a) a.matriculasAtivas += 1;
  }
  for (const t of turmas) {
    const a = porUnidade.get(t.unidadeId);
    if (!a) continue;
    a.turmas += 1;
    a.vagas += t.capacidade;
    a.ocupadas += t._count.matriculas;
  }
  for (const m of mensalidadesMes) {
    const uid = m.unidadeId ?? m.aluno.unidadeId ?? "";
    const a = porUnidade.get(uid);
    if (!a) continue;
    const valor = Number(m.valorFinal);
    a.receitaPrevista += valor;
    if (m.status === "paga") a.receitaRecebida += valor;
  }
  for (const m of inadimplentes) {
    const uid = m.unidadeId ?? m.aluno.unidadeId ?? "";
    const a = porUnidade.get(uid);
    if (a) a.inadimplencia += Number(m.valorFinal);
  }

  const linhas = unidades.map((u) => {
    const a = porUnidade.get(u.id)!;
    const ocupacao = a.vagas > 0 ? (a.ocupadas / a.vagas) * 100 : 0;
    return {
      unidadeId: u.id,
      nome: u.nome,
      cidade: u.cidade,
      uf: u.uf,
      matriculasMes: a.matriculasMes,
      matriculasAtivas: a.matriculasAtivas,
      turmas: a.turmas,
      vagas: a.vagas,
      ocupadas: a.ocupadas,
      ocupacao,
      receitaPrevista: a.receitaPrevista,
      receitaRecebida: a.receitaRecebida,
      inadimplencia: a.inadimplencia,
    };
  });

  const totalAtivas = linhas.reduce((s, l) => s + l.matriculasAtivas, 0);
  const evasao = totalAtivas > 0 ? (canceladasMes / totalAtivas) * 100 : 0;

  const totais = linhas.reduce(
    (s, l) => ({
      matriculasMes: s.matriculasMes + l.matriculasMes,
      matriculasAtivas: s.matriculasAtivas + l.matriculasAtivas,
      turmas: s.turmas + l.turmas,
      vagas: s.vagas + l.vagas,
      ocupadas: s.ocupadas + l.ocupadas,
      receitaPrevista: s.receitaPrevista + l.receitaPrevista,
      receitaRecebida: s.receitaRecebida + l.receitaRecebida,
      inadimplencia: s.inadimplencia + l.inadimplencia,
    }),
    {
      matriculasMes: 0,
      matriculasAtivas: 0,
      turmas: 0,
      vagas: 0,
      ocupadas: 0,
      receitaPrevista: 0,
      receitaRecebida: 0,
      inadimplencia: 0,
    },
  );

  return NextResponse.json({
    competencia,
    geradoEm: agora.toISOString(),
    totais: {
      ...totais,
      ocupacao: totais.vagas > 0 ? (totais.ocupadas / totais.vagas) * 100 : 0,
      evasao,
      canceladasMes,
    },
    unidades: linhas,
  });
}
