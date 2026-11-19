'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type TurmaOpt = {
  id: string;
  codigo: string;
  nome: string;
  curso: { nome: string };
  nivel: { nome: string };
};

export function NovaAulaForm({ turmas }: { turmas: TurmaOpt[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    setOk(false);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      turmaId: String(fd.get('turmaId') || ''),
      data: String(fd.get('data') || ''),
      tema: String(fd.get('tema') || ''),
      conteudo: String(fd.get('conteudo') || ''),
      status: String(fd.get('status') || 'planejada'),
    };
    try {
      const res = await fetch('/api/aulas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Falha ao criar aula');
      }
      setOk(true);
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardTitle>Nova aula</CardTitle>
      <CardBody>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-xs text-fg-muted">
            Turma
            <select
              name="turmaId"
              required
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
            >
              <option value="">Selecione…</option>
              {turmas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.codigo} — {t.curso.nome} / {t.nivel.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-fg-muted">
            Data
            <Input type="date" name="data" required />
          </label>
          <label className="flex flex-col gap-1 text-xs text-fg-muted">
            Tema
            <Input name="tema" placeholder="Ex: Present Perfect" />
          </label>
          <label className="flex flex-col gap-1 text-xs text-fg-muted">
            Conteúdo
            <textarea
              name="conteudo"
              rows={3}
              placeholder="O que foi trabalhado na aula"
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-fg-muted">
            Status
            <select
              name="status"
              defaultValue="planejada"
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
            >
              <option value="planejada">Planejada</option>
              <option value="realizada">Realizada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </label>
          {erro && <p className="text-xs text-red-400">{erro}</p>}
          {ok && <p className="text-xs text-emerald-400">Aula registrada.</p>}
          <Button type="submit" variant="primary" size="md" disabled={loading}>
            {loading ? 'Salvando…' : 'Registrar aula'}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
