'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Unidade = { id: string; nome: string };

export function GerarFolhaForm({ competencia, unidades }: { competencia: string; unidades: Unidade[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErro(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      competencia: String(fd.get('competencia') ?? competencia),
      unidadeId: String(fd.get('unidadeId') ?? '') || null,
    };
    try {
      const res = await fetch('/api/folha-pagamento/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Falha ao gerar folha');
      setOpen(false);
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button variant="primary" size="md" onClick={() => setOpen(true)}>
        Gerar folha
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-surface/70 p-3 backdrop-blur-sm">
      <div>
        <label htmlFor="competencia" className="mb-1 block text-xs text-fg-muted">Competência</label>
        <Input id="competencia" name="competencia" defaultValue={competencia} className="w-32" />
      </div>
      <div>
        <label htmlFor="unidadeId" className="mb-1 block text-xs text-fg-muted">Unidade</label>
        <select
          id="unidadeId"
          name="unidadeId"
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <option value="">Todas</option>
          {unidades.map((u) => (
            <option key={u.id} value={u.id}>{u.nome}</option>
          ))}
        </select>
      </div>
      <Button type="submit" variant="primary" size="sm" disabled={loading}>
        {loading ? 'Gerando…' : 'Confirmar'}
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
      {erro && <p className="w-full text-xs text-red-500">{erro}</p>}
    </form>
  );
}
