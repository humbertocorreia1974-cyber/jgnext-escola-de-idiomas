import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauth' }, { status: 401 });
  const provas = await prisma.prova.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  return NextResponse.json(provas);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauth' }, { status: 401 });
  const role = (session.user as any).role as string;
  if (!['dono', 'coordenacao', 'secretaria', 'professor'].includes(role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const body = await request.json();
  if (!body.titulo) return NextResponse.json({ error: 'titulo obrigatório' }, { status: 400 });

  const prova = await prisma.prova.create({
    data: {
      titulo: body.titulo,
      descricao: body.descricao || null,
      cursoId: body.cursoId || null,
      dataAplicacao: body.dataAplicacao ? new Date(body.dataAplicacao) : null,
      peso: Number(body.peso) || 1,
      notaMaxima: Number(body.notaMaxima) || 10,
      criadoPorId: session.user.id,
    },
  });
  return NextResponse.json(prova, { status: 201 });
}
