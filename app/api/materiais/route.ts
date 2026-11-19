import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauth' }, { status: 401 });
  const items = await prisma.materialDidatico.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauth' }, { status: 401 });
  const role = (session.user as any).role as string;
  if (!['dono', 'coordenacao', 'secretaria', 'professor'].includes(role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = await request.json();
  if (!body.titulo || !body.url) return NextResponse.json({ error: 'titulo e url obrigatórios' }, { status: 400 });

  const material = await prisma.materialDidatico.create({
    data: {
      titulo: body.titulo,
      descricao: body.descricao || null,
      tipo: body.tipo || 'pdf',
      url: body.url,
      cursoId: body.cursoId || null,
      autorId: session.user.id,
      publico: !!body.publico,
    },
  });
  return NextResponse.json(material, { status: 201 });
}
