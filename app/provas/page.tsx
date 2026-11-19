import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProvaForm } from './prova-form';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Provas | JGNEXT Escola de Idiomas',
  description: 'Cadastro e acompanhamento de provas por curso e unidade.',
  openGraph: { title: 'Provas | JGNEXT', description: 'Provas por curso e unidade.' },
};

export default async function Page() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const role = (session.user as any).role as string;
  if (!['dono', 'coordenacao', 'secretaria', 'professor'].includes(role)) redirect('/');

  const [cursos, provas] = await Promise.all([
    prisma.curso.findMany({ where: { ativo: true }, orderBy: { nome: 'asc' }, select: { id: true, nome: true } }),
    prisma.prova.findMany({
      orderBy: { createdAt: 'desc' },
      take: 60,
      include: { curso: { select: { nome: true } }, professor: { select: { nome: true } }, _count: { select: { notas: true } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-fg">Provas</h1>
        <p className="text-sm text-fg-muted">Cadastre avaliações e lance notas por aluno.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardTitle>Avaliações cadastradas</CardTitle>
          <CardBody>
            {provas.length === 0 ? (
              <p className="text-sm text-fg-muted">Nenhuma prova cadastrada. Crie a primeira no formulário ao lado.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
                      <th className="py-2 pr-3">Título</th>
                      <th className="py-2 pr-3">Curso</th>
                      <th className="py-2 pr-3">Aplicação</th>
                      <th className="py-2 pr-3">Peso</th>
                      <th className="py-2 pr-3">Notas</th>
                      <th className="py-2 pr-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {provas.map((p) => (
                      <tr key={p.id} className="border-b border-border/60 transition-colors duration-150 hover:bg-white/5">
                        <td className="py-2 pr-3 text-fg">{p.titulo}</td>
                        <td className="py-2 pr-3 text-fg-muted">{p.curso?.nome || '—'}</td>
                        <td className="py-2 pr-3 text-fg-muted">{p.dataAplicacao ? new Date(p.dataAplicacao).toLocaleDateString('pt-BR') : '—'}</td>
                        <td className="py-2 pr-3 text-fg-muted">{p.peso}</td>
                        <td className="py-2 pr-3 text-fg-muted">{p._count.notas}</td>
                        <td className="py-2 pr-3 text-right">
                          <Link href={`/provas/${p.id}`} className="text-xs text-brand hover:underline">Lançar notas</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>

        <ProvaForm cursos={cursos} />
      </div>
    </div>
  );
}
