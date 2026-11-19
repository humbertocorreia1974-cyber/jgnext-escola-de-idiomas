import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauth' }, { status: 401 });
  const role = (session.user as any).role as string;
  if (!['dono', 'coordenacao', 'secretaria', 'professor'].includes(role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = await request.json();
  const notas: { alunoId: string; valor: number }[] = Array.isArray(body.notas) ? body.notas : [];
  if (notas.length === 0) return NextResponse.json({ ok: true, count: 0 });

  await prisma.$transaction(
    notas.map((n) =>
      prisma.nota.upsert({
        where: { provaId_alunoId: { provaId: params.id, alunoId: n.alunoId } },
        create: { provaId: params.id, alunoId: n.alunoId, valor: Number(n.valor) },
        update: { valor: Number(n.valor) },
      })
    )
  );
  return NextResponse.json({ ok: true, count: notas.length });
}
