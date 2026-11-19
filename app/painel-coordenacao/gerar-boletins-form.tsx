'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function GerarBoletinsForm() {
  const [periodo, setPeriodo] = useState('2025-1');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch('/api/boletins/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Falha ao gerar boletins');
      setMsg(`Boletins recalculados: ${data.atualizados ?? 0}`);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-2">
      <div className="flex-1 min-w-[140px]">
        <label className="mb-1 block text-xs text-fg-muted">Período</label>
        <Input
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          placeholder="2025-1"
        />
      </div>
      <Button type="submit" size="sm" variant="primary" disabled={loading}>
        {loading ? 'Gerando...' : 'Gerar boletins'}
      </Button>
      {msg && <p className="w-full text-xs text-fg-muted">{msg}</p>}
    </form>
  );
}
