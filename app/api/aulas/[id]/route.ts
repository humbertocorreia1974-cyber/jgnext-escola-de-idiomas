import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const PAPEIS_ESCRITA = ['dono', 'coordenacao', 'secretaria', 'professor'];

export async function PATCH(
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
  if (!body) {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.tema === 'string') data.tema = body.tema;
  if (typeof body.conteudo === 'string') data.conteudo = body.conteudo;
  if (typeof body.observacoes === 'string') data.observacoes = body.observacoes;
  if (typeof body.status === 'string') data.status = body.status;
  if (body.data) data.data = new Date(body.data);

  const aula = await prisma.aula.update({ where: { id }, data });
  return NextResponse.json({ aula });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }
  if (!['dono', 'coordenacao'].includes(session.user.role ?? 'user')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }
  const { id } = await params;
  await prisma.aula.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
