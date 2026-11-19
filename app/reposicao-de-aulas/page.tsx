import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ReposicaoForm } from './reposicao-form';
import { ReposicaoAcoes } from './reposicao-acoes';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Reposição de aulas | JGNEXT Escola de Idiomas',
  description:
    'Solicite, agende e acompanhe reposições de aula por aluno, turma e professor — com status pendente, agendada, realizada ou cancelada.',
  openGraph: {
    title: 'Reposição de aulas | JGNEXT',
    description:
      'Controle total das reposições de aula: solicitação, agendamento e realização em um só painel.',
  },
};

const STATUS_LABEL: Record<string, string> = {
  pendente: 'Pendente',
  agendada: 'Agendada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
};

const STATUS_CLASS: Record<string, string> = {
  pendente: 'bg-accent/10 text-accent',
  agendada: 'bg-brand/10 text-brand',
  realizada: 'bg-emerald-500/10 text-emerald-500',
  cancelada: 'bg-red-500/10 text-red-500',
};

type SP = { status?: string; alunoId?: string };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const role = session.user.role ?? 'user';
  const podeGerenciar = ['dono', 'coordenacao', 'secretaria', 'professor'].includes(role);

  const sp = await searchParams;
  const statusFiltro = sp.status && STATUS_LABEL[sp.status] ? sp.status : undefined;
  const alunoFiltro = sp.alunoId?.trim() || undefined;

  // Aluno só vê as próprias reposições
  let where: any = {};
  if (role === 'aluno') {
    const aluno = await prisma.aluno.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!aluno) {
      return (
        <main className="min-h-screen bg-bg px-6 py-10">
          <div className="mx-auto max-w-3xl">
            <Card>
              <CardBody>
                <CardTitle>Sem vínculo de aluno</CardTitle>
                <p className="mt-2 text-sm text-fg-muted">
                  Sua conta ainda não está vinculada a um cadastro de aluno. Fale com a secretaria.
                </p>
              </CardBody>
            </Card>
          </div>
        </main>
      );
    }
    where.alunoId = aluno.id;
  } else if (alunoFiltro) {
    where.alunoId = alunoFiltro;
  }
  if (statusFiltro) where.status = statusFiltro;

  const [reposicoes, alunos, turmas, professores] = await Promise.all([
    prisma.reposicaoAula.findMany({
      where,
      orderBy: [{ dataSolicitacao: 'desc' }],
      take: 100,
      include: {
        aluno: { select: { id: true, nome: true } },
        turma: { select: { id: true, codigo: true, nome: true } },
        professor: { select: { id: true, nome: true } },
        aulaOrigem: { select: { id: true, data: true, tema: true } },
      },
    }),
    podeGerenciar
      ? prisma.aluno.findMany({
          where: { ativo: true },
          orderBy: { nome: 'asc' },
          select: { id: true, nome: true },
          take: 500,
        })
      : Promise.resolve([]),
    podeGerenciar
      ? prisma.turma.findMany({
          where: { status: { in: ['aberta', 'em_andamento'] } },
          orderBy: { codigo: 'asc' },
          select: { id: true, codigo: true, nome: true },
          take: 300,
        })
      : Promise.resolve([]),
    podeGerenciar
      ? prisma.professor.findMany({
          where: { ativo: true },
          orderBy: { nome: 'asc' },
          select: { id: true, nome: true },
          take: 300,
        })
      : Promise.resolve([]),
  ]);

  const totalPendentes = reposicoes.filter((r) => r.status === 'pendente').length;
  const totalAgendadas = reposicoes.filter((r) => r.status === 'agendada').length;

  return (
    <main className="min-h-screen bg-bg px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-fg-muted">Acadêmico</p>
            <h1 className="mt-1 text-2xl font-semibold text-fg">Reposição de aulas</h1>
            <p className="mt-1 text-sm text-fg-muted">
              Solicite, agende e acompanhe as reposições por aluno, turma e professor.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="rounded-full bg-accent/10 px-3 py-1 text-accent">
              {totalPendentes} pendente{totalPendentes === 1 ? '' : 's'}
            </span>
            <span className="rounded-full bg-brand/10 px-3 py-1 text-brand">
              {totalAgendadas} agendada{totalAgendadas === 1 ? '' : 's'}
            </span>
          </div>
        </header>

        {podeGerenciar && (
          <ReposicaoForm alunos={alunos} turmas={turmas} professores={professores} />
        )}

        <Card>
          <CardBody>
            <form className="flex flex-wrap items-end gap-3" method="get">
              <div className="flex flex-col gap-1">
                <label htmlFor="status" className="text-xs text-fg-muted">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={statusFiltro ?? ''}
                  className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
                >
                  <option value="">Todos</option>
                  <option value="pendente">Pendente</option>
                  <option value="agendada">Agendada</option>
                  <option value="realizada">Realizada</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>
              {podeGerenciar && (
                <div className="flex flex-col gap-1">
                  <label htmlFor="alunoId" className="text-xs text-fg-muted">
                    Aluno
                  </label>
                  <select
                    id="alunoId"
                    name="alunoId"
                    defaultValue={alunoFiltro ?? ''}
                    className="min-w-[220px] rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
                  >
                    <option value="">Todos</option>
                    {alunos.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <Button type="submit" variant="secondary" size="sm">
                Filtrar
              </Button>
              {(statusFiltro || alunoFiltro) && (
                <Link
                  href="/reposicao-de-aulas"
                  className="text-sm text-fg-muted underline-offset-4 hover:text-fg hover:underline"
                >
                  Limpar
                </Link>
              )}
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <CardTitle>Reposições</CardTitle>
            {reposicoes.length === 0 ? (
              <div className="mt-4 rounded-md border border-dashed border-border p-6 text-center">
                <p className="text-sm text-fg-muted">
                  Nenhuma reposição encontrada com os filtros atuais.
                </p>
                {podeGerenciar && (
                  <p className="mt-1 text-xs text-fg-muted">
                    Use o formulário acima para registrar a primeira solicitação.
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
                      <th className="px-2 py-2">Aluno</th>
                      <th className="px-2 py-2">Turma</th>
                      <th className="px-2 py-2">Professor</th>
                      <th className="px-2 py-2">Solicitada</th>
                      <th className="px-2 py-2">Reposição</th>
                      <th className="px-2 py-2">Status</th>
                      <th className="px-2 py-2 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reposicoes.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b border-border/60 transition-colors duration-150 hover:bg-white/5"
                      >
                        <td className="px-2 py-3 text-fg">{r.aluno.nome}</td>
                        <td className="px-2 py-3 text-fg-muted">
                          {r.turma ? `${r.turma.codigo} — ${r.turma.nome}` : '—'}
                        </td>
                        <td className="px-2 py-3 text-fg-muted">
                          {r.professor?.nome ?? '—'}
                        </td>
                        <td className="px-2 py-3 text-fg-muted">
                          {new Date(r.dataSolicitacao).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-2 py-3 text-fg-muted">
                          {r.dataReposicao
                            ? new Date(r.dataReposicao).toLocaleString('pt-BR', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })
                            : '—'}
                        </td>
                        <td className="px-2 py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs ${
                              STATUS_CLASS[r.status] ?? 'bg-surface text-fg-muted'
                            }`}
                          >
                            {STATUS_LABEL[r.status] ?? r.status}
                          </span>
                        </td>
                        <td className="px-2 py-3 text-right">
                          {podeGerenciar ? (
                            <ReposicaoAcoes
                              id={r.id}
                              status={r.status}
                              dataReposicao={
                                r.dataReposicao
                                  ? new Date(r.dataReposicao).toISOString().slice(0, 16)
                                  : ''
                              }
                            />
                          ) : (
                            <span className="text-xs text-fg-muted">—</span>
                          )}
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
    </main>
  );
}
