'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Unidade = { id: string; nome: string };

export function NovoProfessorForm({ unidades }: { unidades: Unidade[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErro(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      nome: String(fd.get('nome') ?? '').trim(),
      cpf: String(fd.get('cpf') ?? '').trim() || null,
      email: String(fd.get('email') ?? '').trim() || null,
      telefone: String(fd.get('telefone') ?? '').trim() || null,
      especialidades: String(fd.get('especialidades') ?? '').trim() || null,
      valorHora: fd.get('valorHora') ? Number(fd.get('valorHora')) : null,
      unidadeId: String(fd.get('unidadeId') ?? '') || null,
    };
    try {
      const res = await fetch('/api/professores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Falha ao cadastrar');
      router.push('/professores');
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label htmlFor="nome" className="mb-1 block text-xs text-fg-muted">Nome completo *</label>
        <Input id="nome" name="nome" required />
      </div>
      <div>
        <label htmlFor="cpf" className="mb-1 block text-xs text-fg-muted">CPF</label>
        <Input id="cpf" name="cpf" />
      </div>
      <div>
        <label htmlFor="telefone" className="mb-1 block text-xs text-fg-muted">Telefone</label>
        <Input id="telefone" name="telefone" />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="email" className="mb-1 block text-xs text-fg-muted">E-mail</label>
        <Input id="email" name="email" type="email" />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="especialidades" className="mb-1 block text-xs text-fg-muted">Especialidades</label>
        <Input id="especialidades" name="especialidades" placeholder="Inglês avançado, IELTS, Business English" />
      </div>
      <div>
        <label htmlFor="valorHora" className="mb-1 block text-xs text-fg-muted">Valor/hora (R$)</label>
        <Input id="valorHora" name="valorHora" type="number" step="0.01" min="0" />
      </div>
      <div>
        <label htmlFor="unidadeId" className="mb-1 block text-xs text-fg-muted">Unidade</label>
        <select
          id="unidadeId"
          name="unidadeId"
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <option value="">—</option>
          {unidades.map((u) => (
            <option key={u.id} value={u.id}>{u.nome}</option>
          ))}
        </select>
      </div>
      {erro && <p className="sm:col-span-2 text-sm text-red-500">{erro}</p>}
      <div className="sm:col-span-2 flex justify-end gap-2">
        <Button type="button" variant="ghost" size="md" onClick={() => router.back()}>Cancelar</Button>
        <Button type="submit" variant="primary" size="md" disabled={loading}>
          {loading ? 'Salvando…' : 'Salvar professor'}
        </Button>
      </div>
    </form>
  );
}
