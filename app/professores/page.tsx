import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Plus, Search } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Professores | JGNEXT Escola de Idiomas',
  description: 'Cadastro e gestão de professores por unidade, especialidades e valor-hora.',
  openGraph: {
    title: 'Professores | JGNEXT Escola de Idiomas',
    description: 'Cadastro e gestão de professores por unidade, especialidades e valor-hora.',
  },
};

type SearchParams = Promise<{ q?: string; unidadeId?: string; ativo?: string }>;

export default async function ProfessoresPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const role = (session.user as { role?: string }).role;
  if (!['dono', 'coordenacao', 'secretaria'].includes(role ?? '')) redirect('/');

  const sp = await searchParams;
  const q = sp.q?.trim() ?? '';
  const unidadeId = sp.unidadeId ?? '';
  const ativo = sp.ativo ?? 'todos';

  const [unidades, professores] = await Promise.all([
    prisma.unidade.findMany({ where: { ativa: true }, orderBy: { nome: 'asc' } }),
    prisma.professor.findMany({
      where: {
        ...(q ? { OR: [{ nome: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }] } : {}),
        ...(unidadeId ? { unidadeId } : {}),
        ...(ativo === 'ativos' ? { ativo: true } : ativo === 'inativos' ? { ativo: false } : {}),
      },
      include: {
        unidade: true,
        _count: { select: { turmas: true, aulas: true } },
      },
      orderBy: { nome: 'asc' },
      take: 100,
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-fg-muted">Equipe docente</p>
          <h1 className="mt-1 text-2xl font-semibold text-fg">Professores</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {professores.length} professor{professores.length === 1 ? '' : 'es'} listado{professores.length === 1 ? '' : 's'}
          </p>
        </div>
        <Link href="/professores/novo">
          <Button variant="primary" size="md">
            <Plus className="mr-2 h-4 w-4" /> Novo professor
          </Button>
        </Link>
      </header>

      <Card className="mb-6">
        <CardBody>
          <form className="grid gap-3 sm:grid-cols-4" method="GET">
            <div className="sm:col-span-2">
              <label htmlFor="q" className="mb-1 block text-xs text-fg-muted">Buscar</label>
              <Input id="q" name="q" defaultValue={q} placeholder="Nome ou e-mail" />
            </div>
            <div>
              <label htmlFor="unidadeId" className="mb-1 block text-xs text-fg-muted">Unidade</label>
              <select
                id="unidadeId"
                name="unidadeId"
                defaultValue={unidadeId}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <option value="">Todas</option>
                {unidades.map((u) => (
                  <option key={u.id} value={u.id}>{u.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ativo" className="mb-1 block text-xs text-fg-muted">Status</label>
              <select
                id="ativo"
                name="ativo"
                defaultValue={ativo}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <option value="todos">Todos</option>
                <option value="ativos">Ativos</option>
                <option value="inativos">Inativos</option>
              </select>
            </div>
            <div className="sm:col-span-4 flex justify-end">
              <Button type="submit" variant="secondary" size="sm">
                <Search className="mr-2 h-4 w-4" /> Filtrar
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {professores.length === 0 ? (
        <Card>
          <CardBody className="flex flex-col items-center gap-3 py-14 text-center">
            <Users className="h-8 w-8 text-fg-muted" />
            <CardTitle>Nenhum professor encontrado</CardTitle>
            <p className="max-w-md text-sm text-fg-muted">
              Cadastre o primeiro professor para começar a montar turmas, grade de horários e folha de pagamento.
            </p>
            <Link href="/professores/novo">
              <Button variant="primary" size="sm">Cadastrar professor</Button>
            </Link>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-fg-muted">
                  <tr>
                    <th className="px-4 py-3">Nome</th>
                    <th className="px-4 py-3">Unidade</th>
                    <th className="px-4 py-3">Especialidades</th>
                    <th className="px-4 py-3 text-right">Valor/hora</th>
                    <th className="px-4 py-3 text-right">Turmas</th>
                    <th className="px-4 py-3 text-right">Aulas</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {professores.map((p) => (
                    <tr key={p.id} className="border-b border-border/60 transition-colors duration-150 hover:bg-white/5">
                      <td className="px-4 py-3">
                        <Link href={`/professores/${p.id}`} className="font-medium text-fg hover:text-brand">
                          {p.nome}
                        </Link>
                        {p.email && <div className="text-xs text-fg-muted">{p.email}</div>}
                      </td>
                      <td className="px-4 py-3 text-fg-muted">{p.unidade?.nome ?? '—'}</td>
                      <td className="px-4 py-3 text-fg-muted">{p.especialidades ?? '—'}</td>
                      <td className="px-4 py-3 text-right text-fg">
                        {p.valorHora ? `R$ ${Number(p.valorHora).toFixed(2)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-fg">{p._count.turmas}</td>
                      <td className="px-4 py-3 text-right text-fg">{p._count.aulas}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs ${p.ativo ? 'bg-brand/10 text-brand' : 'bg-fg-muted/10 text-fg-muted'}`}>
                          {p.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
