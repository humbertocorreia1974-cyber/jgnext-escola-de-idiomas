import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardBody, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MatriculaFormClient } from './matricula-form-client';
import { MatriculaActionsClient } from './matricula-actions-client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Matrículas · JGNEXT Escola de Idiomas',
  description:
    'Gerencie matrículas por curso, nível e turma, com geração automática de contrato e mensalidade.',
  openGraph: {
    title: 'Matrículas · JGNEXT Escola de Idiomas',
    description:
      'Matrículas por curso, nível e turma com contrato e mensalidade gerados automaticamente.',
  },
};

const PAPEIS_LEITURA = ['dono', 'coordenacao', 'secretaria', 'professor'];
const PAPEIS_ESCRITA = ['dono', 'coordenacao', 'secretaria'];

const STATUS_LABEL: Record<string, string> = {
  ativa: 'Ativa',
  trancada: 'Trancada',
  cancelada: 'Cancelada',
  concluida: 'Concluída',
};

const STATUS_CLASS: Record<string, string> = {
  ativa: 'bg-brand/10 text-brand',
  trancada: 'bg-amber-500/10 text-amber-400',
  cancelada: 'bg-red-500/10 text-red-400',
  concluida: 'bg-fg-muted/10 text-fg-muted',
};

export default async function MatriculasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; unidadeId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  if (!PAPEIS_LEITURA.includes(session.user.role ?? '')) redirect('/');

  const sp = await searchParams;
  const statusFiltro = sp.status && sp.status !== 'todas' ? sp.status : undefined;
  const q = sp.q?.trim();
  const unidadeId = sp.unidadeId || undefined;

  const where: Record<string, unknown> = {};
  if (statusFiltro) where.status = statusFiltro;
  if (unidadeId) where.turma = { unidadeId };
  if (q) where.aluno = { nome: { contains: q, mode: 'insensitive' } };

  const podeEscrever = PAPEIS_ESCRITA.includes(session.user.role ?? '');

  const [matriculas, contadores, unidades] = await Promise.all([
    prisma.matricula.findMany({
      where,
      include: {
        aluno: { select: { id: true, nome: true } },
        turma: {
          select: {
            id: true,
            codigo: true,
            nome: true,
            unidade: { select: { id: true, nome: true } },
          },
        },
        nivel: { select: { id: true, nome: true, curso: { select: { nome: true } } } },
        _count: { select: { mensalidades: true, contratos: true } },
      },
      orderBy: { dataMatricula: 'desc' },
      take: 200,
    }),
    prisma.matricula.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
    prisma.unidade.findMany({
      where: { ativa: true },
      select: { id: true, nome: true },
      orderBy: { nome: 'asc' },
    }),
  ]);

  const totalPorStatus = contadores.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = c._count._all;
    return acc;
  }, {});

  const total = Object.values(totalPorStatus).reduce((a, b) => a + b, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-fg">Matrículas</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {total} matrícula{total === 1 ? '' : 's'} no total · {totalPorStatus.ativa ?? 0} ativa
            {(totalPorStatus.ativa ?? 0) === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/contratos">
            <Button variant="ghost" size="sm">
              Ver contratos
            </Button>
          </Link>
          <Link href="/mensalidades">
            <Button variant="ghost" size="sm">
              Ver mensalidades
            </Button>
          </Link>
        </div>
      </header>

      <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {(['ativa', 'trancada', 'cancelada', 'concluida'] as const).map((s) => (
          <Card key={s}>
            <CardBody>
              <p className="text-xs uppercase tracking-wide text-fg-muted">
                {STATUS_LABEL[s]}
              </p>
              <p className="mt-1 text-2xl font-semibold text-fg">
                {totalPorStatus[s] ?? 0}
              </p>
            </CardBody>
          </Card>
        ))}
      </section>

      {podeEscrever && (
        <section className="mb-6">
          <MatriculaFormClient />
        </section>
      )}

      <Card className="mb-4">
        <CardBody>
          <form className="grid grid-cols-1 gap-3 md:grid-cols-4" method="get">
            <label className="flex flex-col gap-1 text-sm text-fg-muted">
              Buscar aluno
              <input
                name="q"
                defaultValue={q ?? ''}
                placeholder="Nome do aluno"
                className="rounded-md border border-border bg-surface px-3 py-2 text-fg outline-none focus-visible:ring-2 focus-visible:ring-brand"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-fg-muted">
              Status
              <select
                name="status"
                defaultValue={statusFiltro ?? 'todas'}
                className="rounded-md border border-border bg-surface px-3 py-2 text-fg outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <option value="todas">Todas</option>
                <option value="ativa">Ativa</option>
                <option value="trancada">Trancada</option>
                <option value="cancelada">Cancelada</option>
                <option value="concluida">Concluída</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm text-fg-muted">
              Unidade
              <select
                name="unidadeId"
                defaultValue={unidadeId ?? ''}
                className="rounded-md border border-border bg-surface px-3 py-2 text-fg outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <option value="">Todas</option>
                {unidades.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end gap-2">
              <Button type="submit" size="sm">
                Filtrar
              </Button>
              <Link href="/matriculas">
                <Button type="button" size="sm" variant="ghost">
                  Limpar
                </Button>
              </Link>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <CardTitle>Lista de matrículas</CardTitle>
          {matriculas.length === 0 ? (
            <div className="mt-6 rounded-md border border-dashed border-border bg-surface/50 p-8 text-center">
              <p className="text-sm text-fg-muted">
                Nenhuma matrícula encontrada com esses filtros.
              </p>
              {podeEscrever && (
                <p className="mt-2 text-xs text-fg-muted">
                  Use o formulário acima para matricular o primeiro aluno.
                </p>
              )}
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
                    <th className="py-2 pr-3">Aluno</th>
                    <th className="py-2 pr-3">Curso / Nível</th>
                    <th className="py-2 pr-3">Turma</th>
                    <th className="py-2 pr-3">Unidade</th>
                    <th className="py-2 pr-3">Mensalidade</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Desde</th>
                    {podeEscrever && <th className="py-2 pr-3">Ações</th>}
                  </tr>
                </thead>
                <tbody>
                  {matriculas.map((m) => (
                    <tr
                      key={m.id}
                      className="border-b border-border/60 transition-colors duration-150 hover:bg-white/5"
                    >
                      <td className="py-2 pr-3 text-fg">{m.aluno.nome}</td>
                      <td className="py-2 pr-3 text-fg-muted">
                        {m.nivel.curso.nome} · {m.nivel.nome}
                      </td>
                      <td className="py-2 pr-3 text-fg-muted">
                        <span className="font-mono text-xs">{m.turma.codigo}</span> — {m.turma.nome}
                      </td>
                      <td className="py-2 pr-3 text-fg-muted">{m.turma.unidade.nome}</td>
                      <td className="py-2 pr-3 text-fg">
                        R$ {Number(m.valorMensal).toFixed(2)}
                        {m.desconto > 0 && (
                          <span className="ml-1 text-xs text-fg-muted">
                            (-{Number(m.desconto).toFixed(2)})
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            STATUS_CLASS[m.status] ?? 'bg-fg-muted/10 text-fg-muted'
                          }`}
                        >
                          {STATUS_LABEL[m.status] ?? m.status}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-fg-muted">
                        {new Date(m.dataMatricula).toLocaleDateString('pt-BR')}
                      </td>
                      {podeEscrever && (
                        <td className="py-2 pr-3">
                          <MatriculaActionsClient id={m.id} status={m.status} />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
