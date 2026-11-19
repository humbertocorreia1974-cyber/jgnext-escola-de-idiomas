import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardBody, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlunoForm } from './aluno-form';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Alunos | JGNEXT Escola de Idiomas',
  description:
    'Cadastro e gestão de alunos por unidade, com vínculo a responsável, CPF e status ativo.',
  openGraph: {
    title: 'Alunos | JGNEXT Escola de Idiomas',
    description:
      'Cadastro e gestão de alunos por unidade, com vínculo a responsável, CPF e status ativo.',
  },
};

const PAPEIS_ESCRITA = new Set(['dono', 'coordenacao', 'secretaria']);

type SearchParams = {
  q?: string;
  unidadeId?: string;
  ativo?: string;
  novo?: string;
  editar?: string;
};

export default async function AlunosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const role = (session.user as { role?: string }).role ?? 'user';
  const podeEscrever = PAPEIS_ESCRITA.has(role);

  const sp = await searchParams;
  const q = (sp.q ?? '').trim();
  const unidadeId = sp.unidadeId ?? '';
  const ativoFiltro = sp.ativo ?? '';

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { nome: { contains: q, mode: 'insensitive' } },
      { cpf: { contains: q } },
      { email: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (unidadeId) where.unidadeId = unidadeId;
  if (ativoFiltro === 'true') where.ativo = true;
  if (ativoFiltro === 'false') where.ativo = false;

  const [alunos, unidades] = await Promise.all([
    prisma.aluno.findMany({
      where,
      orderBy: { nome: 'asc' },
      take: 200,
      include: {
        unidade: { select: { id: true, nome: true } },
        responsavel: { select: { id: true, nome: true } },
        _count: { select: { matriculas: true } },
      },
    }),
    prisma.unidade.findMany({
      where: { ativa: true },
      orderBy: { nome: 'asc' },
      select: { id: true, nome: true },
    }),
  ]);

  const editando = sp.editar
    ? await prisma.aluno.findUnique({
        where: { id: sp.editar },
        select: {
          id: true,
          nome: true,
          cpf: true,
          email: true,
          telefone: true,
          endereco: true,
          dataNascimento: true,
          unidadeId: true,
          ativo: true,
        },
      })
    : null;

  const mostrarForm = podeEscrever && (sp.novo === '1' || !!editando);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-fg">Alunos</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {alunos.length} aluno{alunos.length === 1 ? '' : 's'} encontrado
            {alunos.length === 1 ? '' : 's'}
            {q ? ` para "${q}"` : ''}.
          </p>
        </div>
        {podeEscrever && !mostrarForm && (
          <Link href="/alunos?novo=1">
            <Button variant="primary" size="md">
              Novo aluno
            </Button>
          </Link>
        )}
      </header>

      <Card className="mb-6">
        <CardBody>
          <form method="get" className="grid gap-3 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-fg-muted" htmlFor="q">
                Buscar por nome, CPF ou e-mail
              </label>
              <Input
                id="q"
                name="q"
                defaultValue={q}
                placeholder="Ex.: Maria, 123.456.789-00"
              />
            </div>
            <div>
              <label
                className="mb-1 block text-xs text-fg-muted"
                htmlFor="unidadeId"
              >
                Unidade
              </label>
              <select
                id="unidadeId"
                name="unidadeId"
                defaultValue={unidadeId}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <option value="">Todas</option>
                {unidades.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                className="mb-1 block text-xs text-fg-muted"
                htmlFor="ativo"
              >
                Status
              </label>
              <select
                id="ativo"
                name="ativo"
                defaultValue={ativoFiltro}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <option value="">Todos</option>
                <option value="true">Ativos</option>
                <option value="false">Inativos</option>
              </select>
            </div>
            <div className="sm:col-span-4 flex justify-end gap-2">
              <Link href="/alunos">
                <Button variant="ghost" size="sm" type="button">
                  Limpar
                </Button>
              </Link>
              <Button variant="secondary" size="sm" type="submit">
                Filtrar
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {mostrarForm && (
        <Card className="mb-6">
          <CardBody>
            <CardTitle className="mb-4">
              {editando ? 'Editar aluno' : 'Novo aluno'}
            </CardTitle>
            <AlunoForm
              unidades={unidades}
              aluno={
                editando
                  ? {
                      ...editando,
                      dataNascimento: editando.dataNascimento
                        ? editando.dataNascimento.toISOString().slice(0, 10)
                        : null,
                    }
                  : null
              }
            />
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody className="p-0">
          {alunos.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <p className="text-sm text-fg-muted">
                Nenhum aluno encontrado com esses filtros.
              </p>
              {podeEscrever && (
                <Link href="/alunos?novo=1">
                  <Button variant="primary" size="sm">
                    Cadastrar primeiro aluno
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Nome</th>
                    <th className="px-4 py-3 font-medium">Contato</th>
                    <th className="px-4 py-3 font-medium">Unidade</th>
                    <th className="px-4 py-3 font-medium">Responsável</th>
                    <th className="px-4 py-3 font-medium">Matrículas</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    {podeEscrever && (
                      <th className="px-4 py-3 font-medium text-right">Ações</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {alunos.map((a) => (
                    <tr
                      key={a.id}
                      className="border-b border-border/60 transition-colors duration-150 hover:bg-white/5"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-fg">{a.nome}</div>
                        {a.cpf && (
                          <div className="text-xs text-fg-muted">{a.cpf}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-fg-muted">
                        {a.email ?? '—'}
                        {a.telefone && (
                          <div className="text-xs">{a.telefone}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-fg-muted">
                        {a.unidade?.nome ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-fg-muted">
                        {a.responsavel?.nome ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-fg-muted">
                        {a._count.matriculas}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            a.ativo
                              ? 'rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand'
                              : 'rounded-full bg-fg-muted/10 px-2 py-0.5 text-xs text-fg-muted'
                          }
                        >
                          {a.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      {podeEscrever && (
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/alunos?editar=${a.id}`}
                            className="text-xs text-brand transition-colors duration-150 hover:underline"
                          >
                            Editar
                          </Link>
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
    </main>
  );
}
