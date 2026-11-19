'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Unidade = { id: string; nome: string };

export default function DispararNotificacaoForm({ unidades }: { unidades: Unidade[] }) {
  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [unidadeId, setUnidadeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch('/api/notificacoes/disparar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo, mensagem, unidadeId: unidadeId || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Falha ao disparar');
      setMsg(`Notificação enviada para ${data.enviados ?? 0} usuários.`);
      setTitulo('');
      setMensagem('');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <p className="text-xs uppercase tracking-wider text-fg-muted">
        Disparar notificação
      </p>
      <Input
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Título"
        required
      />
      <Input
        value={mensagem}
        onChange={(e) => setMensagem(e.target.value)}
        placeholder="Mensagem"
        required
      />
      <select
        value={unidadeId}
        onChange={(e) => setUnidadeId(e.target.value)}
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <option value="">Todas as unidades</option>
        {unidades.map((u) => (
          <option key={u.id} value={u.id}>
            {u.nome}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" variant="primary" disabled={loading}>
        {loading ? 'Enviando...' : 'Enviar'}
      </Button>
      {msg && <p className="text-xs text-fg-muted">{msg}</p>}
    </form>
  );
}
