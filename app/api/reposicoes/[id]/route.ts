import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const PAPEIS_GESTAO = ['dono', 'coordenacao', 'secretaria', 'professor'];
const STATUS_VALIDOS = ['pendente', 'agendada', 'realizada', 'cancelada'];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }
  const role = session.user.role ?? 'user';
  if (!PAPEIS_GESTAO.includes(role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  const { id } = await params;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const existente = await prisma.reposicaoAula.findUnique({ where: { id } });
  if (!existente) {
    return NextResponse.json({ error: 'Reposição não encontrada' }, { status: 404 });
  }

  const data: any = {};

  if (typeof body?.status === 'string') {
    if (!STATUS_VALIDOS.includes(body.status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
    }
    data.status = body.status;
  }

  if (typeof body?.dataReposicao === 'string' && body.dataReposicao) {
    const d = new Date(body.dataReposicao);
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: 'Data inválida' }, { status: 400 });
    }
    data.dataReposicao = d;
    if (!data.status) data.status = 'agendada';
  }

  if (typeof body?.motivo === 'string') {
    data.motivo = body.motivo || null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nada para atualizar' }, { status: 400 });
  }

  const reposicao = await prisma.reposicaoAula.update({
    where: { id },
    data,
  });

  return NextResponse.json({ reposicao });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }
  const { id } = await params;
  const reposicao = await prisma.reposicaoAula.findUnique({
    where: { id },
    include: {
      aluno: { select: { id: true, nome: true } },
      turma: { select: { id: true, codigo: true, nome: true } },
      professor: { select: { id: true, nome: true } },
    },
  });
  if (!reposicao) {
    return NextResponse.json({ error: 'Não encontrada' }, { status: 404 });
  }
  return NextResponse.json({ reposicao });
}
