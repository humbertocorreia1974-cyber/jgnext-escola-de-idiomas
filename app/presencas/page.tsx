import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Presenças | JGNEXT Escola de Idiomas',
  description: 'Acompanhe a frequência dos alunos por turma, aula e período.',
  openGraph: { title: 'Presenças | JGNEXT', description: 'Frequência por turma e período.' },
};

export default async function Page({ searchParams }: { searchParams: { turmaId?: string; periodo?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const role = (session.user as any).role as string;
  if (!['dono', 'coordenacao', 'secretaria', 'professor'].includes(role)) redirect('/');

  const turmas = await prisma.turma.findMany({ orderBy: { nome: 'asc' }, select: { id: true, nome: true, codigo: true } });
  const turmaId = searchParams.turmaId || turmas[0]?.id;
  const periodo = searchParams.periodo || '';

  const aulas = turmaId
    ? await prisma.aula.findMany({
        where: {
          turmaId,
          ...(periodo ? { data: { gte: new Date(periodo + '-01'), lt: new Date(new Date(periodo + '-01').setMonth(new Date(periodo + '-01').getMonth() + 1)) } } : {}),
        },
        orderBy: { data: 'desc' },
        take: 40,
        include: {
          presencas: { include: { aluno: { select: { id: true, nome: true } } } },
          turma: { select: { nome: true, codigo: true } },
        },
      })
    : [];

  const totalPresencas = aulas.reduce((acc, a) => acc + a.presencas.length, 0);
  const totalPresentes = aulas.reduce((acc, a) => acc + a.presencas.filter((p) => p.presente).length, 0);
  const taxa = totalPresencas ? Math.round((totalPresentes / totalPresencas) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-fg">Presenças</h1>
          <p className="text-sm text-fg-muted">Frequência consolidada por turma e período.</p>
        </div>
        <Link href="/diario-classe"><Button variant="secondary" size="sm">Ir para o diário</Button></Link>
      </header>

      <Card className="mb-6">
        <CardBody>
          <form className="flex flex-wrap items-end gap-3" method="get">
            <label className="flex flex-col gap-1 text-xs text-fg-muted">
              Turma
              <select name="turmaId" defaultValue={turmaId} className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg">
                {turmas.map((t) => (<option key={t.id} value={t.id}>{t.codigo} — {t.nome}</option>))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-fg-muted">
              Período (AAAA-MM)
              <input name="periodo" defaultValue={periodo} placeholder="2025-01" className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg" />
            </label>
            <Button type="submit" size="sm">Filtrar</Button>
          </form>
        </CardBody>
      </Card>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card><CardBody><p className="text-xs text-fg-muted">Aulas no período</p><p className="mt-1 text-2xl font-semibold text-fg">{aulas.length}</p></CardBody></Card>
        <Card><CardBody><p className="text-xs text-fg-muted">Registros de presença</p><p className="mt-1 text-2xl font-semibold text-fg">{totalPresencas}</p></CardBody></Card>
        <Card><CardBody><p className="text-xs text-fg-muted">Taxa de presença</p><p className="mt-1 text-2xl font-semibold text-brand">{taxa}%</p></CardBody></Card>
      </div>

      {aulas.length === 0 ? (
        <Card><CardBody>
          <p className="text-sm text-fg-muted">Nenhuma aula registrada para este filtro.</p>
          <Link href="/diario-classe" className="mt-3 inline-block"><Button size="sm">Registrar aula no diário</Button></Link>
        </CardBody></Card>
      ) : (
        <Card>
          <CardTitle>Detalhamento por aula</CardTitle>
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
                    <th className="py-2 pr-3">Data</th>
                    <th className="py-2 pr-3">Turma</th>
                    <th className="py-2 pr-3">Tema</th>
                    <th className="py-2 pr-3">Presentes</th>
                    <th className="py-2 pr-3">Ausentes</th>
                    <th className="py-2 pr-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {aulas.map((a) => {
                    const presentes = a.presencas.filter((p) => p.presente).length;
                    const ausentes = a.presencas.length - presentes;
                    return (
                      <tr key={a.id} className="border-b border-border/60 transition-colors duration-150 hover:bg-white/5">
                        <td className="py-2 pr-3 text-fg">{new Date(a.data).toLocaleDateString('pt-BR')}</td>
                        <td className="py-2 pr-3 text-fg-muted">{a.turma.codigo}</td>
                        <td className="py-2 pr-3 text-fg-muted">{a.tema || a.conteudo || '—'}</td>
                        <td className="py-2 pr-3 text-fg">{presentes}</td>
                        <td className="py-2 pr-3 text-fg-muted">{ausentes}</td>
                        <td className="py-2 pr-3">
                          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">{a.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
