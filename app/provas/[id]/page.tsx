import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { NotasForm } from './notas-form';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Lançar notas | JGNEXT',
  description: 'Lançamento de notas por prova.',
  openGraph: { title: 'Lançar notas | JGNEXT', description: 'Lançamento de notas.' },
};

export default async function Page({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const role = (session.user as any).role as string;
  if (!['dono', 'coordenacao', 'secretaria', 'professor'].includes(role)) redirect('/');

  const prova = await prisma.prova.findUnique({
    where: { id: params.id },
    include: { curso: { select: { nome: true } }, notas: true },
  });
  if (!prova) notFound();

  const alunos = await prisma.aluno.findMany({
    where: { ativo: true, matriculas: { some: { status: 'ativa' } } },
    orderBy: { nome: 'asc' },
    take: 200,
    select: { id: true, nome: true },
  });

  const notasExistentes = Object.fromEntries(prova.notas.map((n) => [n.alunoId, n.valor]));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-fg">{prova.titulo}</h1>
        <p className="text-sm text-fg-muted">{prova.curso?.nome || 'Sem curso'} · Nota máxima {prova.notaMaxima} · Peso {prova.peso}</p>
      </header>

      <Card>
        <CardTitle>Lançamento de notas</CardTitle>
        <CardBody>
          {alunos.length === 0 ? (
            <p className="text-sm text-fg-muted">Nenhum aluno ativo para lançar notas.</p>
          ) : (
            <NotasForm provaId={prova.id} alunos={alunos} notasExistentes={notasExistentes} />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
