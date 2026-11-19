import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const PAPEIS_ESCRITA = new Set(['dono', 'coordenacao', 'secretaria']);

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') ?? '').trim();
  const unidadeId = searchParams.get('unidadeId') ?? '';
  const ativo = searchParams.get('ativo') ?? '';

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { nome: { contains: q, mode: 'insensitive' } },
      { cpf: { contains: q } },
      { email: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (unidadeId) where.unidadeId = unidadeId;
  if (ativo === 'true') where.ativo = true;
  if (ativo === 'false') where.ativo = false;

  const alunos = await prisma.aluno.findMany({
    where,
    orderBy: { nome: 'asc' },
    take: 200,
    include: {
      unidade: { select: { id: true, nome: true } },
      responsavel: { select: { id: true, nome: true } },
      _count: { select: { matriculas: true } },
    },
  });

  return NextResponse.json({ alunos });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role ?? 'user';
  if (!PAPEIS_ESCRITA.has(role)) {
    return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.nome !== 'string' || !body.nome.trim()) {
    return NextResponse.json(
      { error: 'Nome é obrigatório.' },
      { status: 400 },
    );
  }

  try {
    const aluno = await prisma.aluno.create({
      data: {
        nome: body.nome.trim(),
        cpf: body.cpf || null,
        email: body.email || null,
        telefone: body.telefone || null,
        endereco: body.endereco || null,
        dataNascimento: body.dataNascimento
          ? new Date(body.dataNascimento)
          : null,
        unidadeId: body.unidadeId || null,
        ativo: body.ativo !== false,
      },
    });
    return NextResponse.json({ aluno }, { status: 201 });
  } catch (err) {
    const msg =
      err instanceof Error && err.message.includes('Unique')
        ? 'CPF já cadastrado.'
        : 'Erro ao criar aluno.';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
