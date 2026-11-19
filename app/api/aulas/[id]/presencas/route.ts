import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const PAPEIS_ESCRITA = ['dono', 'coordenacao', 'secretaria', 'professor'];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { id } = await params;
  const aula = await prisma.aula.findUnique({
    where: { id },
    select: { id: true, turmaId: true },
  });
  if (!aula) {
    return NextResponse.json({ error: 'Aula não encontrada' }, { status: 404 });
  }

  const matriculas = await prisma.matricula.findMany({
    where: { turmaId: aula.turmaId, status: 'ativa' },
    include: { aluno: { select: { id: true, nome: true } } },
    orderBy: { aluno: { nome: 'asc' } },
  });

  const presencas = await prisma.presenca.findMany({
    where: { aulaId: id },
  });
  const porAluno = new Map(presencas.map((p) => [p.alunoId, p]));

  const alunos = matriculas.map((m) => {
    const p = porAluno.get(m.alunoId);
    return {
      id: m.alunoId,
      nome: m.aluno.nome,
      presente: p?.presente ?? false,
      justificada: p?.justificada ?? false,
    };
  });

  return NextResponse.json({ alunos });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }
  if (!PAPEIS_ESCRITA.includes(session.user.role ?? 'user')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const presencas: Array<{
    id: string;
    presente: boolean;
    justificada: boolean;
  }> = body?.presencas ?? [];

  if (!Array.isArray(presencas) || presencas.length === 0) {
    return NextResponse.json(
      { error: 'Lista de presenças vazia' },
      { status: 400 },
    );
  }

  await prisma.$transaction(
    presencas.map((p) =>
      prisma.presenca.upsert({
        where: { aulaId_alunoId: { aulaId: id, alunoId: p.id } },
        create: {
          aulaId: id,
          alunoId: p.id,
          presente: !!p.presente,
          justificada: !!p.justificada,
        },
        update: {
          presente: !!p.presente,
          justificada: !!p.justificada,
        },
      }),
    ),
  );

  return NextResponse.json({ ok: true, total: presencas.length });
}
