import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Search } from 'lucide-react';
import { GerarFolhaForm } from './gerar-folha-form';
import { Input } from "@/components/ui/input";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Carga horária e folha | JGNEXT Escola de Idiomas',
  description: 'Consolidação de horas-aula por professor e geração da folha de pagamento mensal.',
  openGraph: {
    title: 'Carga horária e folha | JGNEXT Escola de Idiomas',
    description: 'Consolidação de horas-aula por professor e geração da folha de pagamento mensal.',
  },
};

type SearchParams = Promise<{ competencia?: string; unidadeId?: string }>;

function competenciaAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default async function CargaHorariaPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const role = (session.user as { role?: string }).role;
  if (!['dono', 'coordenacao'].includes(role ?? '')) redirect('/');

  const sp = await searchParams;
  const competencia = sp.competencia ?? competenciaAtual();
  const unidadeId = sp.unidadeId ?? '';

  const [unidades, cargas, folhas] = await Promise.all([
    prisma.unidade.findMany({ where: { ativa: true }, orderBy: { nome: 'asc' } }),
    prisma.cargaHoraria.findMany({
      where: {
        competencia,
        ...(unidadeId ? { professor: { unidadeId } } : {}),
      },
      include: { professor: { include: { unidade: true } } },
      orderBy: { professor: { nome: 'asc' } },
    }),
    prisma.folhaPagamento.findMany({
      where: {
        competencia,
        ...(unidadeId ? { unidadeId } : {}),
      },
      include: { professor: true, unidade: true },
      orderBy: { professor: { nome: 'asc' } },
    }),
  ]);

  const totalHoras = cargas.reduce((acc, c) => acc + c.horasAula + c.horasExtras, 0);
  const totalFolha = folhas.reduce((acc, f) => acc + Number(f.valorLiquido), 0);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-fg-muted">Financeiro docente</p>
          <h1 className="mt-1 text-2xl font-semibold text-fg">Carga horária e folha</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Competência {competencia} · {totalHoras.toFixed(1)}h registradas · R$ {totalFolha.toFixed(2)} em folha
          </p>
        </div>
        <GerarFolhaForm competencia={competencia} unidades={unidades.map((u) => ({ id: u.id, nome: u.nome }))} />
      </header>

      <Card className="mb-6">
        <CardBody>
          <form className="grid gap-3 sm:grid-cols-3" method="GET">
            <div>
              <label htmlFor="competencia" className="mb-1 block text-xs text-fg-muted">Competência</label>
              <Input id="competencia" name="competencia" defaultValue={competencia} placeholder="2025-01" />
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
            <div className="flex items-end justify-end">
              <Button type="submit" variant="secondary" size="sm">
                <Search className="mr-2 h-4 w-4" /> Aplicar
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardBody className="p-0">
            <div className="border-b border-border px-4 py-3">
              <CardTitle>Carga horária consolidada</CardTitle>
            </div>
            {cargas.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <Clock className="h-7 w-7 text-fg-muted" />
                <p className="text-sm text-fg-muted">Nenhuma carga horária lançada para {competencia}.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-fg-muted">
                    <tr>
                      <th className="px-4 py-3">Professor</th>
                      <th className="px-4 py-3 text-right">Horas</th>
                      <th className="px-4 py-3 text-right">Extras</th>
                      <th className="px-4 py-3 text-right">Valor/h</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cargas.map((c) => (
                      <tr key={c.id} className="border-b border-border/60 transition-colors duration-150 hover:bg-white/5">
                        <td className="px-4 py-3">
                          <div className="font-medium text-fg">{c.professor.nome}</div>
                          <div className="text-xs text-fg-muted">{c.professor.unidade?.nome ?? '—'}</div>
                        </td>
                        <td className="px-4 py-3 text-right text-fg">{c.horasAula.toFixed(1)}</td>
                        <td className="px-4 py-3 text-right text-fg">{c.horasExtras.toFixed(1)}</td>
                        <td className="px-4 py-3 text-right text-fg-muted">R$ {Number(c.valorHora).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-medium text-fg">R$ {Number(c.valorTotal).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-0">
            <div className="border-b border-border px-4 py-3">
              <CardTitle>Folha de pagamento</CardTitle>
            </div>
            {folhas.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <p className="text-sm text-fg-muted">Folha ainda não gerada para {competencia}.</p>
                <p className="max-w-xs text-xs text-fg-muted">
                  Use o botão &quot;Gerar folha&quot; no topo para consolidar as cargas horárias do mês.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-fg-muted">
                    <tr>
                      <th className="px-4 py-3">Professor</th>
                      <th className="px-4 py-3 text-right">Bruto</th>
                      <th className="px-4 py-3 text-right">Descontos</th>
                      <th className="px-4 py-3 text-right">Líquido</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {folhas.map((f) => (
                      <tr key={f.id} className="border-b border-border/60 transition-colors duration-150 hover:bg-white/5">
                        <td className="px-4 py-3 font-medium text-fg">{f.professor.nome}</td>
                        <td className="px-4 py-3 text-right text-fg-muted">R$ {Number(f.valorBruto).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-fg-muted">R$ {Number(f.descontos).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-medium text-fg">R$ {Number(f.valorLiquido).toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs ${f.status === 'pago' ? 'bg-brand/10 text-brand' : 'bg-fg-muted/10 text-fg-muted'}`}>
                            {f.status}
                          </span>
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

      <p className="mt-6 text-xs text-fg-muted">
        Precisa lançar horas manualmente? <Link href="/diario-classe" className="text-brand hover:underline">Abra o diário de classe</Link> e marque as aulas como realizadas.
      </p>
    </div>
  );
}
