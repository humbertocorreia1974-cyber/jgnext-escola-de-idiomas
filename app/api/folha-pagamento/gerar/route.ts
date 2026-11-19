import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (!['dono', 'coordenacao'].includes(role ?? '')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const competencia: string = body?.competencia ?? '';
  const unidadeId: string | null = body?.unidadeId ?? null;

  if (!/^\d{4}-\d{2}$/.test(competencia)) {
    return NextResponse.json({ error: 'Competência inválida (use AAAA-MM)' }, { status: 400 });
  }

  const cargas = await prisma.cargaHoraria.findMany({
    where: {
      competencia,
      ...(unidadeId ? { professor: { unidadeId } } : {}),
    },
    include: { professor: true },
  });

  if (cargas.length === 0) {
    return NextResponse.json({ error: 'Nenhuma carga horária encontrada para essa competência' }, { status: 404 });
  }

  let criadas = 0;
  let atualizadas = 0;

  for (const c of cargas) {
    const valorBruto = Number(c.valorTotal);
    const descontos = 0;
    const valorLiquido = valorBruto - descontos;

    const existente = await prisma.folhaPagamento.findUnique({
      where: { professorId_competencia: { professorId: c.professorId, competencia } },
    });

    if (existente) {
      await prisma.folhaPagamento.update({
        where: { id: existente.id },
        data: { valorBruto, descontos, valorLiquido },
      });
      atualizadas += 1;
    } else {
      await prisma.folhaPagamento.create({
        data: {
          professorId: c.professorId,
          unidadeId: c.professor.unidadeId ?? null,
          competencia,
          valorBruto,
          descontos,
          valorLiquido,
          status: 'pendente',
        },
      });
      criadas += 1;
    }
  }

  return NextResponse.json({ ok: true, criadas, atualizadas });
}
