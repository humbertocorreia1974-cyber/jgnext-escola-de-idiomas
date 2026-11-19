import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (!['dono', 'coordenacao', 'secretaria'].includes(role ?? '')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const unidadeId = searchParams.get('unidadeId') ?? undefined;
  const professores = await prisma.professor.findMany({
    where: { ...(unidadeId ? { unidadeId } : {}) },
    include: { unidade: true },
    orderBy: { nome: 'asc' },
  });
  return NextResponse.json({ professores });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (!['dono', 'coordenacao', 'secretaria'].includes(role ?? '')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }
  const body = await request.json();
  if (!body?.nome || typeof body.nome !== 'string') {
    return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
  }
  try {
    const professor = await prisma.professor.create({
      data: {
        nome: body.nome,
        cpf: body.cpf ?? null,
        email: body.email ?? null,
        telefone: body.telefone ?? null,
        especialidades: body.especialidades ?? null,
        valorHora: body.valorHora ?? null,
        unidadeId: body.unidadeId ?? null,
      },
    });
    return NextResponse.json({ professor }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao criar professor';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
