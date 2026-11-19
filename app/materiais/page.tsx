import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MaterialForm } from './material-form';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Materiais didáticos | JGNEXT Escola de Idiomas',
  description: 'Biblioteca de materiais didáticos por curso, nível e unidade.',
  openGraph: { title: 'Materiais didáticos | JGNEXT', description: 'Biblioteca de materiais por curso.' },
};

export default async function Page({ searchParams }: { searchParams: { cursoId?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const role = (session.user as any).role as string;
  if (!['dono', 'coordenacao', 'secretaria', 'professor'].includes(role)) redirect('/');

  const [cursos, materiais] = await Promise.all([
    prisma.curso.findMany({ where: { ativo: true }, orderBy: { nome: 'asc' }, select: { id: true, nome: true } }),
    prisma.materialDidatico.findMany({
      where: searchParams.cursoId ? { cursoId: searchParams.cursoId } : {},
      orderBy: { createdAt: 'desc' },
      take: 60,
      include: { curso: { select: { nome: true } }, autor: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-fg">Materiais didáticos</h1>
        <p className="text-sm text-fg-muted">Biblioteca por curso, nível e unidade.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardTitle>Biblioteca</CardTitle>
          <CardBody>
            <form method="get" className="mb-4 flex items-end gap-3">
              <label className="flex flex-col gap-1 text-xs text-fg-muted">
                Curso
                <select name="cursoId" defaultValue={searchParams.cursoId || ''} className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg">
                  <option value="">Todos</option>
                  {cursos.map((c) => (<option key={c.id} value={c.id}>{c.nome}</option>))}
                </select>
              </label>
              <Button type="submit" size="sm" variant="secondary">Filtrar</Button>
            </form>

            {materiais.length === 0 ? (
              <p className="text-sm text-fg-muted">Nenhum material cadastrado ainda. Use o formulário ao lado para publicar o primeiro.</p>
            ) : (
              <ul className="divide-y divide-border">
                {materiais.map((m) => (
                  <li key={m.id} className="flex items-start justify-between gap-3 py-3 transition-colors duration-150 hover:bg-white/5">
                    <div>
                      <p className="text-sm font-medium text-fg">{m.titulo}</p>
                      <p className="text-xs text-fg-muted">{m.curso?.nome || 'Sem curso'} · {m.tipo} · {m.autor?.name || 'Sistema'}</p>
                      {m.descricao && <p className="mt-1 text-xs text-fg-muted">{m.descricao}</p>}
                    </div>
                    <a href={m.url} target="_blank" rel="noreferrer" className="text-xs text-brand hover:underline">Abrir</a>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <MaterialForm cursos={cursos} />
      </div>
    </div>
  );
}
