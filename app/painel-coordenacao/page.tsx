import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import GerarBoletinsForm from './gerar-boletins-form';
import DispararNotificacaoForm from './disparar-notificacao-form';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Painel da Coordenação | JGNEXT Escola de Idiomas',
  description:
    'Acompanhe turmas, professores, boletins pendentes e reposições de aula em todas as unidades.',
  openGraph: {
    title: 'Painel da Coordenação | JGNEXT',
    description:
      'Turmas ativas, professores, boletins pendentes e reposições em um só painel.',
  },
};

export default async function Page() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  if (!session?.user || !['dono', 'coordenacao', 'secretaria'].includes(role ?? '')) {
    redirect('/login');
  }

  const [
    turmasAtivas,
    professoresAtivos,
    matriculasAtivas,
    reposicoesPendentes,
    boletinsEmAndamento,
    notificacoesRecentes,
    unidades,
  ] = await Promise.all([
    prisma.turma.findMany({
      where: { status: { in: ['aberta', 'em_andamento'] } },
      include: {
        curso: true,
        nivel: true,
        unidade: true,
        professor: true,
        _count: { select: { matriculas: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 12,
    }),
    prisma.professor.count({ where: { ativo: true } }),
    prisma.matricula.count({ where: { status: 'ativa' } }),
    prisma.reposicaoAula.findMany({
      where: { status: 'pendente' },
      include: { aluno: true, turma: true },
      orderBy: { dataSolicitacao: 'asc' },
      take: 8,
    }),
    prisma.boletim.findMany({
      where: { situacao: 'em_andamento' },
      include: { aluno: true, matricula: { include: { turma: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 8,
    }),
    prisma.notificacao.findMany({
      where: { tipo: { in: ['academico', 'alerta'] } },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    prisma.unidade.findMany({ where: { ativa: true }, orderBy: { nome: 'asc' } }),
  ]);

  const ocupacaoMedia =
    turmasAtivas.length === 0
      ? 0
      : Math.round(
          (turmasAtivas.reduce(
            (acc, t) => acc + t._count.matriculas / Math.max(t.capacidade, 1),
            0,
          ) /
            turmasAtivas.length) *
            100,
        );

  const kpis = [
    { label: 'Turmas ativas', value: turmasAtivas.length },
    { label: 'Professores ativos', value: professoresAtivos },
    { label: 'Matrículas ativas', value: matriculasAtivas },
    { label: 'Ocupação média', value: `${ocupacaoMedia}%` },
  ];

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-fg-muted">
              Coordenação
            </p>
            <h1 className="mt-1 text-3xl font-semibold text-fg">
              Painel da Coordenação
            </h1>
            <p className="mt-1 text-sm text-fg-muted">
              Visão consolidada de turmas, professores, boletins e reposições.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/turmas">
              <Button variant="secondary" size="sm">
                Turmas
              </Button>
            </Link>
            <Link href="/boletins">
              <Button variant="primary" size="sm">
                Boletins
              </Button>
            </Link>
          </div>
        </header>

        <section className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {kpis.map((k) => (
            <Card key={k.label}>
              <CardBody>
                <p className="text-xs uppercase tracking-wider text-fg-muted">
                  {k.label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-fg">{k.value}</p>
              </CardBody>
            </Card>
          ))}
        </section>

        <section className="mb-8 grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardBody>
              <div className="mb-4 flex items-center justify-between">
                <CardTitle>Turmas em operação</CardTitle>
                <Link
                  href="/turmas"
                  className="text-xs text-brand hover:underline"
                >
                  ver todas
                </Link>
              </div>
              {turmasAtivas.length === 0 ? (
                <div className="rounded-md border border-dashed border-border p-6 text-center">
                  <p className="text-sm text-fg-muted">
                    Nenhuma turma aberta ou em andamento.
                  </p>
                  <Link href="/turmas" className="mt-3 inline-block">
                    <Button size="sm" variant="primary">
                      Criar primeira turma
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-fg-muted">
                        <th className="py-2 pr-3">Turma</th>
                        <th className="py-2 pr-3">Curso / Nível</th>
                        <th className="py-2 pr-3">Unidade</th>
                        <th className="py-2 pr-3">Professor</th>
                        <th className="py-2 pr-3">Ocupação</th>
                        <th className="py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {turmasAtivas.map((t) => {
                        const pct = Math.round(
                          (t._count.matriculas / Math.max(t.capacidade, 1)) * 100,
                        );
                        return (
                          <tr
                            key={t.id}
                            className="border-b border-border/60 transition-colors duration-150 hover:bg-white/5"
                          >
                            <td className="py-2 pr-3">
                              <Link
                                href={`/turmas`}
                                className="font-medium text-fg hover:text-brand"
                              >
                                {t.codigo} · {t.nome}
                              </Link>
                            </td>
                            <td className="py-2 pr-3 text-fg-muted">
                              {t.curso.nome} · {t.nivel.nome}
                            </td>
                            <td className="py-2 pr-3 text-fg-muted">
                              {t.unidade.nome}
                            </td>
                            <td className="py-2 pr-3 text-fg-muted">
                              {t.professor?.nome ?? '—'}
                            </td>
                            <td className="py-2 pr-3">
                              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">
                                {t._count.matriculas}/{t.capacidade} ({pct}%)
                              </span>
                            </td>
                            <td className="py-2">
                              <span className="rounded-full bg-surface/70 px-2 py-0.5 text-xs text-fg-muted">
                                {t.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <CardTitle>Reposições pendentes</CardTitle>
              {reposicoesPendentes.length === 0 ? (
                <p className="mt-3 text-sm text-fg-muted">
                  Nenhuma reposição aguardando agendamento.
                </p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {reposicoesPendentes.map((r) => (
                    <li
                      key={r.id}
                      className="rounded-md border border-border p-3 transition-colors duration-150 hover:bg-white/5"
                    >
                      <p className="text-sm font-medium text-fg">
                        {r.aluno.nome}
                      </p>
                      <p className="text-xs text-fg-muted">
                        {r.turma?.nome ?? 'Sem turma'} ·{' '}
                        {r.motivo ?? 'sem motivo informado'}
                      </p>
                      <Link
                        href="/reposicao-aulas"
                        className="mt-2 inline-block text-xs text-brand hover:underline"
                      >
                        agendar →
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardBody>
              <div className="mb-4 flex items-center justify-between">
                <CardTitle>Boletins em andamento</CardTitle>
                <Link
                  href="/boletins"
                  className="text-xs text-brand hover:underline"
                >
                  ver todos
                </Link>
              </div>
              {boletinsEmAndamento.length === 0 ? (
                <div className="rounded-md border border-dashed border-border p-6 text-center">
                  <p className="text-sm text-fg-muted">
                    Nenhum boletim pendente de fechamento.
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {boletinsEmAndamento.map((b) => (
                    <li
                      key={b.id}
                      className="flex items-center justify-between rounded-md border border-border px-3 py-2 transition-colors duration-150 hover:bg-white/5"
                    >
                      <div>
                        <p className="text-sm text-fg">{b.aluno.nome}</p>
                        <p className="text-xs text-fg-muted">
                          {b.matricula.turma.nome} · {b.periodo}
                        </p>
                      </div>
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent-fg">
                        {b.situacao}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 border-t border-border pt-4">
                <GerarBoletinsForm />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <CardTitle>Notificações recentes</CardTitle>
              {notificacoesRecentes.length === 0 ? (
                <p className="mt-3 text-sm text-fg-muted">
                  Nenhuma notificação acadêmica recente.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {notificacoesRecentes.map((n) => (
                    <li
                      key={n.id}
                      className="rounded-md border border-border px-3 py-2 transition-colors duration-150 hover:bg-white/5"
                    >
                      <p className="text-sm text-fg">{n.titulo}</p>
                      <p className="text-xs text-fg-muted">
                        {n.user.name} · {n.tipo}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 border-t border-border pt-4">
                <DispararNotificacaoForm unidades={unidades.map((u) => ({ id: u.id, nome: u.nome }))} />
              </div>
            </CardBody>
          </Card>
        </section>
      </div>
    </div>
  );
}
