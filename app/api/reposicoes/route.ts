import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const PAPEIS_GESTAO = ['dono', 'coordenacao', 'secretaria', 'professor'];

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }
  const role = session.user.role ?? 'user';
  const url = new URL(request.url);
  const status = url.searchParams.get('status') ?? undefined;
  const alunoId = url.searchParams.get('alunoId') ?? undefined;

  const where: any = {};
  if (status) where.status = status;

  if (role === 'aluno') {
    const aluno = await prisma.aluno.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!aluno) return NextResponse.json({ reposicoes: [] });
    where.alunoId = aluno.id;
  } else if (alunoId) {
    where.alunoId = alunoId;
  }

  const reposicoes = await prisma.reposicaoAula.findMany({
    where,
    orderBy: { dataSolicitacao: 'desc' },
    take: 200,
    include: {
      aluno: { select: { id: true, nome: true } },
      turma: { select: { id: true, codigo: true, nome: true } },
      professor: { select: { id: true, nome: true } },
    },
  });

  return NextResponse.json({ reposicoes });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }
  const role = session.user.role ?? 'user';
  if (!PAPEIS_GESTAO.includes(role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const alunoId = typeof body?.alunoId === 'string' ? body.alunoId : '';
  if (!alunoId) {
    return NextResponse.json({ error: 'alunoId é obrigatório' }, { status: 400 });
  }

  const aluno = await prisma.aluno.findUnique({
    where: { id: alunoId },
    select: { id: true, unidadeId: true },
  });
  if (!aluno) {
    return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 });
  }

  const turmaId = typeof body?.turmaId === 'string' && body.turmaId ? body.turmaId : null;
  const professorId =
    typeof body?.professorId === 'string' && body.professorId ? body.professorId : null;
  const motivo = typeof body?.motivo === 'string' && body.motivo ? body.motivo : null;

  let dataReposicao: Date | null = null;
  if (typeof body?.dataReposicao === 'string' && body.dataReposicao) {
    const d = new Date(body.dataReposicao);
    if (!Number.isNaN(d.getTime())) dataReposicao = d;
  }

  const status = dataReposicao ? 'agendada' : 'pendente';

  const reposicao = await prisma.reposicaoAula.create({
    data: {
      alunoId,
      turmaId,
      professorId,
      unidadeId: aluno.unidadeId ?? null,
      solicitadoPorId: session.user.id,
      motivo,
      dataReposicao,
      status,
    },
  });

  return NextResponse.json({ reposicao }, { status: 201 });
}
