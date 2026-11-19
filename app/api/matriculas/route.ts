import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const PAPEIS_ESCRITA = ['dono', 'coordenacao', 'secretaria'];

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const alunoId = searchParams.get('alunoId');

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (alunoId) where.alunoId = alunoId;

  const matriculas = await prisma.matricula.findMany({
    where,
    include: {
      aluno: { select: { id: true, nome: true } },
      turma: { select: { id: true, codigo: true, nome: true } },
      nivel: { select: { id: true, nome: true } },
    },
    orderBy: { dataMatricula: 'desc' },
    take: 200,
  });

  return NextResponse.json({ matriculas });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !PAPEIS_ESCRITA.includes(session.user.role ?? '')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });

  const { alunoId, turmaId, nivelId, valorMensal, desconto, observacoes } = body as {
    alunoId?: string;
    turmaId?: string;
    nivelId?: string;
    valorMensal?: number;
    desconto?: number;
    observacoes?: string;
  };

  if (!alunoId || !turmaId || !nivelId || typeof valorMensal !== 'number') {
    return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
  }

  const turma = await prisma.turma.findUnique({
    where: { id: turmaId },
    include: {
      curso: true,
      unidade: true,
      _count: { select: { matriculas: true } },
    },
  });
  if (!turma) return NextResponse.json({ error: 'Turma não encontrada' }, { status: 404 });
  if (turma._count.matriculas >= turma.capacidade) {
    return NextResponse.json({ error: 'Turma lotada' }, { status: 409 });
  }

  const jaMatriculado = await prisma.matricula.findFirst({
    where: { alunoId, turmaId, status: { in: ['ativa', 'trancada'] } },
  });
  if (jaMatriculado) {
    return NextResponse.json({ error: 'Aluno já matriculado nesta turma' }, { status: 409 });
  }

  const descontoNum = typeof desconto === 'number' ? desconto : 0;
  const valorFinal = Math.max(valorMensal - descontoNum, 0);

  const matricula = await prisma.$transaction(async (tx) => {
    const m = await tx.matricula.create({
      data: {
        alunoId,
        turmaId,
        nivelId,
        valorMensal,
        desconto: descontoNum,
        observacoes: observacoes || null,
        status: 'ativa',
      },
    });

    const numero = `CT-${new Date().getFullYear()}-${m.id.slice(-6).toUpperCase()}`;
    const dataInicio = new Date();
    const dataFim = new Date(dataInicio);
    dataFim.setMonth(dataFim.getMonth() + 12);

    const contrato = await tx.contrato.create({
      data: {
        numero,
        matriculaId: m.id,
        alunoId,
        unidadeId: turma.unidadeId,
        cursoId: turma.cursoId,
        criadoPorId: session.user.id,
        dataInicio,
        dataFim,
        valorTotal: valorFinal * 12,
        parcelas: 12,
        status: 'ativo',
      },
    });

    const competencia = `${dataInicio.getFullYear()}-${String(dataInicio.getMonth() + 1).padStart(2, '0')}`;
    const vencimento = new Date(dataInicio.getFullYear(), dataInicio.getMonth(), 10);

    await tx.mensalidade.create({
      data: {
        matriculaId: m.id,
        contratoId: contrato.id,
        alunoId,
        unidadeId: turma.unidadeId,
        competencia,
        valor: valorMensal,
        desconto: descontoNum,
        valorFinal,
        vencimento,
        status: 'pendente',
      },
    });

    return m;
  });

  return NextResponse.json({ matricula }, { status: 201 });
}
