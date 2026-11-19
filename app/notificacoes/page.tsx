import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Check, CheckCheck, Mail, AlertTriangle, DollarSign, GraduationCap, Info } from 'lucide-react';
import { MarcarLidaButton, MarcarTodasButton } from './marcar-lida-client';
import { DispararNotificacaoForm } from './disparar-form-client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Notificações | JGNEXT Escola de Idiomas',
  description: 'Central de notificações do sistema: cobranças, avisos acadêmicos e alertas do sistema.',
  openGraph: {
    title: 'Notificações | JGNEXT Escola de Idiomas',
    description: 'Central de notificações do sistema.',
  },
};

const TIPO_ICON: Record<string, JSX.Element> = {
  info: <Info className="h-4 w-4 text-brand" />,
  alerta: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  cobranca: <DollarSign className="h-4 w-4 text-rose-500" />,
  academico: <GraduationCap className="h-4 w-4 text-emerald-500" />,
  sistema: <Bell className="h-4 w-4 text-fg-muted" />,
};

const TIPO_LABEL: Record<string, string> = {
  info: 'Info',
  alerta: 'Alerta',
  cobranca: 'Cobrança',
  academico: 'Acadêmico',
  sistema: 'Sistema',
};

export default async function NotificacoesPage({
  searchParams,
}: {
  searchParams: { tipo?: string; status?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const tipo = searchParams.tipo && searchParams.tipo !== 'todos' ? searchParams.tipo : undefined;
  const status = searchParams.status ?? 'todas';

  const where: any = { userId: session.user.id };
  if (tipo) where.tipo = tipo;
  if (status === 'nao_lidas') where.lida = false;
  if (status === 'lidas') where.lida = true;

  const [notificacoes, naoLidas, total] = await Promise.all([
    prisma.notificacao.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.notificacao.count({ where: { userId: session.user.id, lida: false } }),
    prisma.notificacao.count({ where: { userId: session.user.id } }),
  ]);

  const podeDisparar = ['dono', 'coordenacao', 'secretaria'].includes(session.user.role ?? '');

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-fg">Notificações</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {naoLidas > 0
              ? `Você tem ${naoLidas} notificaç${naoLidas === 1 ? 'ão' : 'ões'} não lida${naoLidas === 1 ? '' : 's'}.`
              : 'Você está em dia. Nenhuma notificação pendente.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {naoLidas > 0 && <MarcarTodasButton />}
        </div>
      </header>

      <Card className="mb-6">
        <CardBody>
          <form className="flex flex-wrap items-end gap-3" method="get">
            <div className="flex flex-col gap-1">
              <label htmlFor="tipo" className="text-xs font-medium text-fg-muted">Tipo</label>
              <select
                id="tipo"
                name="tipo"
                defaultValue={tipo ?? 'todos'}
                className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
              >
                <option value="todos">Todos</option>
                <option value="info">Info</option>
                <option value="alerta">Alerta</option>
                <option value="cobranca">Cobrança</option>
                <option value="academico">Acadêmico</option>
                <option value="sistema">Sistema</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="status" className="text-xs font-medium text-fg-muted">Status</label>
              <select
                id="status"
                name="status"
                defaultValue={status}
                className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
              >
                <option value="todas">Todas</option>
                <option value="nao_lidas">Não lidas</option>
                <option value="lidas">Lidas</option>
              </select>
            </div>
            <Button type="submit" variant="secondary" size="sm">Filtrar</Button>
            <Link
              href="/notificacoes"
              className="text-xs text-fg-muted underline-offset-4 hover:underline"
            >
              Limpar
            </Link>
          </form>
        </CardBody>
      </Card>

      {podeDisparar && (
        <Card className="mb-6">
          <CardBody>
            <CardTitle className="mb-3 flex items-center gap-2">
              <Mail className="h-4 w-4 text-brand" />
              Disparar notificação
            </CardTitle>
            <DispararNotificacaoForm />
          </CardBody>
        </Card>
      )}

      {notificacoes.length === 0 ? (
        <Card>
          <CardBody className="flex flex-col items-center gap-3 py-12 text-center">
            <BellOff className="h-8 w-8 text-fg-muted" />
            <p className="text-sm text-fg-muted">
              {total === 0
                ? 'Nenhuma notificação por aqui ainda. Assim que houver novidades acadêmicas ou financeiras, elas aparecem nesta tela.'
                : 'Nenhuma notificação corresponde aos filtros selecionados.'}
            </p>
            {total > 0 && (
              <Link href="/notificacoes">
                <Button variant="secondary" size="sm">Ver todas</Button>
              </Link>
            )}
          </CardBody>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {notificacoes.map((n) => (
            <li key={n.id}>
              <Card
                className={
                  n.lida
                    ? 'transition-all duration-150'
                    : 'border-brand/40 bg-brand/5 transition-all duration-150'
                }
              >
                <CardBody className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface/70 border border-border">
                    {TIPO_ICON[n.tipo] ?? TIPO_ICON.info}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-fg">{n.titulo}</p>
                      <span className="rounded-full bg-surface/70 border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-fg-muted">
                        {TIPO_LABEL[n.tipo] ?? n.tipo}
                      </span>
                      {!n.lida && (
                        <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brand">
                          Nova
                        </span>
                      )}
                    </div>
                    <p className="mt-1 whitespace-pre-line text-sm text-fg-muted">{n.mensagem}</p>
                    <p className="mt-2 text-xs text-fg-muted">
                      {new Date(n.createdAt).toLocaleString('pt-BR')}
                      {n.lida && n.lidaEm ? ` · lida em ${new Date(n.lidaEm).toLocaleString('pt-BR')}` : ''}
                    </p>
                  </div>
                  {!n.lida && (
                    <MarcarLidaButton id={n.id} />
                  )}
                  {n.lida && (
                    <span className="mt-1 flex items-center gap-1 text-xs text-fg-muted">
                      <Check className="h-3.5 w-3.5" /> Lida
                    </span>
                  )}
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
