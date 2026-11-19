import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  if (!session?.user || !['dono', 'coordenacao', 'secretaria'].includes(role ?? '')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const titulo: string = (body?.titulo ?? '').trim();
  const mensagem: string = (body?.mensagem ?? '').trim();
  const unidadeId: string | undefined = body?.unidadeId;

  if (!titulo || !mensagem) {
    return NextResponse.json(
      { error: 'Título e mensagem são obrigatórios' },
      { status: 400 },
    );
  }

  const where = unidadeId
    ? {
        OR: [
          { aluno: { unidadeId } },
          { professor: { unidadeId } },
        ],
      }
    : {};

  const usuarios = await prisma.user.findMany({
    where: {
      role: { in: ['aluno', 'professor', 'coordenacao', 'secretaria'] },
      ...where,
    },
    select: { id: true, email: true, name: true },
  });

  if (usuarios.length === 0) {
    return NextResponse.json({ enviados: 0 });
  }

  await prisma.notificacao.createMany({
    data: usuarios.map((u) => ({
      userId: u.id,
      titulo,
      mensagem,
      tipo: 'academico',
      canal: 'app',
    })),
  });

  const html = `<div style="font-family:sans-serif"><h2>${titulo}</h2><p>${mensagem}</p></div>`;
  await Promise.all(
    usuarios.map((u) =>
      sendEmail({ to: u.email, subject: titulo, html }).catch(() => null),
    ),
  );

  return NextResponse.json({ enviados: usuarios.length });
}
