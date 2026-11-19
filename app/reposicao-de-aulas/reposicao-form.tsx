'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Opt = { id: string; nome: string };
type TurmaOpt = { id: string; codigo: string; nome: string };

export function ReposicaoForm({
  alunos,
  turmas,
  professores,
}: {
  alunos: Opt[];
  turmas: TurmaOpt[];
  professores: Opt[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    setOk(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      alunoId: String(fd.get('alunoId') ?? ''),
      turmaId: String(fd.get('turmaId') ?? '') || null,
      professorId: String(fd.get('professorId') ?? '') || null,
      motivo: String(fd.get('motivo') ?? '') || null,
      dataReposicao: String(fd.get('dataReposicao') ?? '') || null,
    };
    try {
      const res = await fetch('/api/reposicoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Falha ao criar reposição');
      setOk('Reposição registrada com sucesso.');
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } catch (err: any) {
      setErro(err?.message ?? 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardBody>
        <CardTitle>Nova solicitação de reposição</CardTitle>
        <form onSubmit={onSubmit} className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="alunoId" className="text-xs text-fg-muted">
              Aluno *
            </label>
            <select
              id="alunoId"
              name="alunoId"
              required
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
            >
              <option value="">Selecione…</option>
              {alunos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="turmaId" className="text-xs text-fg-muted">
              Turma
            </label>
            <select
              id="turmaId"
              name="turmaId"
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
            >
              <option value="">—</option>
              {turmas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.codigo} — {t.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="professorId" className="text-xs text-fg-muted">
              Professor
            </label>
            <select
              id="professorId"
              name="professorId"
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
            >
              <option value="">—</option>
              {professores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="dataReposicao" className="text-xs text-fg-muted">
              Data/hora da reposição (opcional)
            </label>
            <Input id="dataReposicao" name="dataReposicao" type="datetime-local" />
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <label htmlFor="motivo" className="text-xs text-fg-muted">
              Motivo
            </label>
            <Input
              id="motivo"
              name="motivo"
              placeholder="Ex.: falta justificada por atestado médico"
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-3">
            <Button type="submit" disabled={loading} size="md">
              {loading ? 'Enviando…' : 'Registrar reposição'}
            </Button>
            {erro && <span className="text-sm text-red-500">{erro}</span>}
            {ok && <span className="text-sm text-emerald-500">{ok}</span>}
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
