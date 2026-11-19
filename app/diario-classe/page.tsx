import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NovaAulaForm } from './nova-aula-form';
import { PresencaClient } from './presenca-client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Diário de Classe | JGNEXT Escola de Idiomas',
  description:
    'Registre aulas, conteúdo ministrado, presenças e observações por turma no diário de classe da sua escola de idiomas.',
  openGraph: {
    title: 'Diário de Classe | JGNEXT',
    description:
      'Controle diário de aulas, conteúdo e presenças por turma em todas as unidades.',
    type: 'website',
  },
};

const PAPEIS_PERMITIDOS = ['dono', 'coordenacao', 'secretaria', 'professor'];

export default async function DiarioClassePage({
  searchParams,
}: {
  searchParams: Promise<{ turmaId?: string; data?: string; status?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  if (!PAPEIS_PERMITIDOS.includes(session.user.role ?? 'user')) redirect('/');

  const sp = await searchParams;
  const turmaId = sp.turmaId || '';
  const dataFiltro = sp.data || '';
  const statusFiltro = sp.status || '';

  const where: Record<string, unknown> = {};
  if (turmaId) where.turmaId = turmaId;
  if (statusFiltro) where.status = statusFiltro;
  if (dataFiltro) {
    const d = new Date(dataFiltro);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    where.data = { gte: d, lt: next };
  }

  const [turmas, aulas] = await Promise.all([
    prisma.turma.findMany({
      where: { status: { in: ['aberta', 'em_andamento'] } },
      select: {
        id: true,
        codigo: true,
        nome: true,
        curso: { select: { nome: true } },
        nivel: { select: { nome: true } },
      },
      orderBy: { codigo: 'asc' },
    }),
    prisma.aula.findMany({
      where,
      include: {
        turma: {
          select: {
            id: true,
            codigo: true,
            nome: true,
            curso: { select: { nome: true } },
            nivel: { select: { nome: true } },
          },
        },
        professor: { select: { id: true, nome: true } },
        _count: { select: { presencas: true } },
      },
      orderBy: { data: 'desc' },
      take: 60,
    }),
  ]);

  const totalRealizadas = aulas.filter((a) => a.status === 'realizada').length;
  const totalPlanejadas = aulas.filter((a) => a.status === 'planejada').length;

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-fg-muted">
              Acadêmico
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Diário de Classe
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-fg-muted">
              Registre o conteúdo de cada aula, marque presenças e acompanhe o
              andamento das turmas em todas as unidades.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="rounded-full bg-brand/10 px-3 py-1 text-brand">
              {totalRealizadas} realizadas
            </span>
            <span className="rounded-full bg-surface border border-border px-3 py-1 text-fg-muted">
              {totalPlanejadas} planejadas
            </span>
          </div>
        </header>

        <Card className="mb-6">
          <CardTitle>Filtros</CardTitle>
          <CardBody>
            <form
              method="GET"
              className="grid grid-cols-1 gap-3 md:grid-cols-4"
            >
              <label className="flex flex-col gap-1 text-xs text-fg-muted">
                Turma
                <select
                  name="turmaId"
                  defaultValue={turmaId}
                  className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
                >
                  <option value="">Todas as turmas</option>
                  {turmas.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.codigo} — {t.curso.nome} / {t.nivel.nome}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-fg-muted">
                Data
                <Input type="date" name="data" defaultValue={dataFiltro} />
              </label>
              <label className="flex flex-col gap-1 text-xs text-fg-muted">
                Status
                <select
                  name="status"
                  defaultValue={statusFiltro}
                  className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
                >
                  <option value="">Todos</option>
                  <option value="planejada">Planejada</option>
                  <option value="realizada">Realizada</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </label>
              <div className="flex items-end gap-2">
                <Button type="submit" variant="primary" size="md">
                  Filtrar
                </Button>
                <Link
                  href="/diario-classe"
                  className="text-xs text-fg-muted underline-offset-4 hover:underline"
                >
                  Limpar
                </Link>
              </div>
            </form>
          </CardBody>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardTitle>Aulas registradas</CardTitle>
              <CardBody>
                {aulas.length === 0 ? (
                  <div className="flex flex-col items-start gap-3 py-8">
                    <p className="text-sm text-fg-muted">
                      Nenhuma aula encontrada com esses filtros. Crie a primeira
                      aula ao lado para começar o diário.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
                          <th className="py-2 pr-3">Data</th>
                          <th className="py-2 pr-3">Turma</th>
                          <th className="py-2 pr-3">Tema</th>
                          <th className="py-2 pr-3">Professor</th>
                          <th className="py-2 pr-3">Presenças</th>
                          <th className="py-2 pr-3">Status</th>
                          <th className="py-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {aulas.map((a) => (
                          <tr
                            key={a.id}
                            className="border-b border-border/60 transition-colors duration-150 hover:bg-white/5"
                          >
                            <td className="py-3 pr-3 whitespace-nowrap">
                              {new Date(a.data).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="py-3 pr-3">
                              <div className="font-medium">
                                {a.turma.codigo}
                              </div>
                              <div className="text-xs text-fg-muted">
                                {a.turma.curso.nome} · {a.turma.nivel.nome}
                              </div>
                            </td>
                            <td className="py-3 pr-3 max-w-[220px] truncate">
                              {a.tema || a.conteudo || '—'}
                            </td>
                            <td className="py-3 pr-3">
                              {a.professor?.nome ?? '—'}
                            </td>
                            <td className="py-3 pr-3">
                              {a._count.presencas}
                            </td>
                            <td className="py-3 pr-3">
                              <StatusBadge status={a.status} />
                            </td>
                            <td className="py-3 text-right">
                              <Link
                                href={`/diario-classe/${a.id}`}
                                className="text-xs text-brand underline-offset-4 hover:underline"
                              >
                                Abrir
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          <div className="space-y-6">
            <NovaAulaForm turmas={turmas} />
            <PresencaClient aulas={aulas.slice(0, 10).map((a) => ({
              id: a.id,
              label: `${new Date(a.data).toLocaleDateString('pt-BR')} · ${a.turma.codigo}`,
            }))} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    planejada: 'bg-brand/10 text-brand',
    realizada: 'bg-emerald-500/10 text-emerald-400',
    cancelada: 'bg-red-500/10 text-red-400',
  };
  const cls = map[status] ?? 'bg-surface border border-border text-fg-muted';
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${cls}`}>
      {status}
    </span>
  );
}
