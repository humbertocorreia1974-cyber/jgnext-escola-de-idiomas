import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const PAPEIS_ESCRITA = ['dono', 'coordenacao', 'secretaria', 'professor'];

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const turmaId = searchParams.get('turmaId') || undefined;
  const status = searchParams.get('status') || undefined;

  const aulas = await prisma.aula.findMany({
    where: {
      ...(turmaId ? { turmaId } : {}),
      ...(status ? { status } : {}),
    },
    include: {
      turma: { select: { id: true, codigo: true, nome: true } },
      professor: { select: { id: true, nome: true } },
      _count: { select: { presencas: true } },
    },
    orderBy: { data: 'desc' },
    take: 100,
  });
  return NextResponse.json({ aulas });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }
  if (!PAPEIS_ESCRITA.includes(session.user.role ?? 'user')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.turmaId || !body?.data) {
    return NextResponse.json(
      { error: 'turmaId e data são obrigatórios' },
      { status: 400 },
    );
  }

  const turma = await prisma.turma.findUnique({
    where: { id: body.turmaId },
    select: { id: true, professorId: true },
  });
  if (!turma) {
    return NextResponse.json({ error: 'Turma não encontrada' }, { status: 404 });
  }

  const aula = await prisma.aula.create({
    data: {
      turmaId: turma.id,
      professorId: turma.professorId ?? null,
      data: new Date(body.data),
      tema: body.tema || null,
      conteudo: body.conteudo || null,
      status: body.status || 'planejada',
    },
  });

  return NextResponse.json({ aula }, { status: 201 });
}
