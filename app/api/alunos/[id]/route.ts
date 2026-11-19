import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const PAPEIS_ESCRITA = new Set(['dono', 'coordenacao', 'secretaria']);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }
  const { id } = await params;
  const aluno = await prisma.aluno.findUnique({
    where: { id },
    include: {
      unidade: true,
      responsavel: true,
      matriculas: { include: { turma: true, nivel: true } },
    },
  });
  if (!aluno) {
    return NextResponse.json({ error: 'Aluno não encontrado.' }, { status: 404 });
  }
  return NextResponse.json({ aluno });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role ?? 'user';
  if (!PAPEIS_ESCRITA.has(role)) {
    return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
  }

  try {
    const aluno = await prisma.aluno.update({
      where: { id },
      data: {
        nome: typeof body.nome === 'string' ? body.nome.trim() : undefined,
        cpf: body.cpf ?? undefined,
        email: body.email ?? undefined,
        telefone: body.telefone ?? undefined,
        endereco: body.endereco ?? undefined,
        dataNascimento: body.dataNascimento
          ? new Date(body.dataNascimento)
          : body.dataNascimento === null
            ? null
            : undefined,
        unidadeId: body.unidadeId ?? undefined,
        ativo: typeof body.ativo === 'boolean' ? body.ativo : undefined,
      },
    });
    return NextResponse.json({ aluno });
  } catch (err) {
    const msg =
      err instanceof Error && err.message.includes('Unique')
        ? 'CPF já cadastrado.'
        : 'Erro ao atualizar aluno.';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role ?? 'user';
  if (!PAPEIS_ESCRITA.has(role)) {
    return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });
  }
  const { id } = await params;
  try {
    await prisma.aluno.update({
      where: { id },
      data: { ativo: false },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: 'Erro ao desativar aluno.' },
      { status: 400 },
    );
  }
}
