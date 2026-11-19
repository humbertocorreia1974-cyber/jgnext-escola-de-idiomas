import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  if (!session?.user || !['dono', 'coordenacao', 'secretaria'].includes(role ?? '')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const periodo: string = body?.periodo ?? '';
  if (!periodo) {
    return NextResponse.json({ error: 'Período obrigatório' }, { status: 400 });
  }

  const matriculas = await prisma.matricula.findMany({
    where: { status: 'ativa' },
    include: {
      aluno: true,
      turma: { include: { curso: true } },
    },
  });

  let atualizados = 0;

  for (const m of matriculas) {
    const [notas, presencas] = await Promise.all([
      prisma.nota.findMany({
        where: { alunoId: m.alunoId, prova: { cursoId: m.turma.cursoId } },
        include: { prova: true },
      }),
      prisma.presenca.findMany({
        where: { alunoId: m.alunoId, aula: { turmaId: m.turmaId } },
      }),
    ]);

    const somaPesos = notas.reduce((acc, n) => acc + (n.prova.peso || 1), 0);
    const mediaFinal =
      somaPesos > 0
        ? notas.reduce((acc, n) => acc + n.valor * (n.prova.peso || 1), 0) / somaPesos
        : null;

    const totalAulas = presencas.length;
    const presentes = presencas.filter((p) => p.presente).length;
    const frequencia = totalAulas > 0 ? (presentes / totalAulas) * 100 : null;

    const freqMin = m.turma.curso.frequenciaMinima ?? 75;
    let situacao = 'em_andamento';
    if (mediaFinal !== null && frequencia !== null) {
      if (frequencia < freqMin) situacao = 'reprovado';
      else if (mediaFinal >= 7) situacao = 'aprovado';
      else if (mediaFinal >= 5) situacao = 'recuperacao';
      else situacao = 'reprovado';
    }

    await prisma.boletim.upsert({
      where: {
        alunoId_matriculaId_periodo: {
          alunoId: m.alunoId,
          matriculaId: m.id,
          periodo,
        },
      },
      update: {
        mediaFinal: mediaFinal ?? undefined,
        frequencia: frequencia ?? undefined,
        situacao,
        emitidoEm: new Date(),
      },
      create: {
        alunoId: m.alunoId,
        matriculaId: m.id,
        periodo,
        mediaFinal: mediaFinal ?? undefined,
        frequencia: frequencia ?? undefined,
        situacao,
        emitidoEm: new Date(),
      },
    });
    atualizados += 1;
  }

  return NextResponse.json({ atualizados });
}
