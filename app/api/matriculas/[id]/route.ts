import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const PAPEIS_ESCRITA = ['dono', 'coordenacao', 'secretaria'];
const STATUS_VALIDOS = ['ativa', 'trancada', 'cancelada', 'concluida'];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !PAPEIS_ESCRITA.includes(session.user.role ?? '')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const status = body?.status as string | undefined;
  if (!status || !STATUS_VALIDOS.includes(status)) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
  }

  const existente = await prisma.matricula.findUnique({ where: { id } });
  if (!existente) return NextResponse.json({ error: 'Não encontrada' }, { status: 404 });

  const matricula = await prisma.matricula.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json({ matricula });
}
