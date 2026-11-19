import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const [alunos, turmas, niveis] = await Promise.all([
    prisma.aluno.findMany({
      where: { ativo: true },
      select: { id: true, nome: true, cpf: true },
      orderBy: { nome: 'asc' },
    }),
    prisma.turma.findMany({
      where: { status: { in: ['aberta', 'em_andamento'] } },
      select: {
        id: true,
        codigo: true,
        nome: true,
        capacidade: true,
        nivelId: true,
        nivel: { select: { nome: true, curso: { select: { nome: true } } } },
        _count: { select: { matriculas: true } },
      },
      orderBy: { codigo: 'asc' },
    }),
    prisma.nivel.findMany({
      select: { id: true, nome: true, curso: { select: { nome: true } } },
      orderBy: [{ curso: { nome: 'asc' } }, { ordem: 'asc' }],
    }),
  ]);

  return NextResponse.json({ alunos, turmas, niveis });
}
