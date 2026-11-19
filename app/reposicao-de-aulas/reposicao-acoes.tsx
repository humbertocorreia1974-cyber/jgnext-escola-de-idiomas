'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ReposicaoAcoes({
  id,
  status,
  dataReposicao,
}: {
  id: string;
  status: string;
  dataReposicao: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(dataReposicao);

  async function patch(body: Record<string, unknown>) {
    setLoading(true);
    try {
      const res = await fetch(`/api/reposicoes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d?.error ?? 'Falha ao atualizar');
        return;
      }
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (status === 'realizada' || status === 'cancelada') {
    return <span className="text-xs text-fg-muted">—</span>;
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {status === 'pendente' && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-md border border-border px-2 py-1 text-xs text-fg transition-colors duration-150 hover:bg-white/5"
        >
          {open ? 'Fechar' : 'Agendar'}
        </button>
      )}
      {status === 'agendada' && (
        <button
          type="button"
          disabled={loading}
          onClick={() => patch({ status: 'realizada' })}
          className="rounded-md border border-border px-2 py-1 text-xs text-fg transition-colors duration-150 hover:bg-white/5 disabled:opacity-50"
        >
          Marcar realizada
        </button>
      )}
      <button
        type="button"
        disabled={loading}
        onClick={() => patch({ status: 'cancelada' })}
        className="rounded-md border border-border px-2 py-1 text-xs text-red-500 transition-colors duration-150 hover:bg-red-500/10 disabled:opacity-50"
      >
        Cancelar
      </button>

      {open && (
        <div className="mt-2 flex w-full items-center justify-end gap-2">
          <input
            type="datetime-local"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-fg outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
          />
          <button
            type="button"
            disabled={loading || !data}
            onClick={() => patch({ status: 'agendada', dataReposicao: data })}
            className="rounded-md bg-brand px-2 py-1 text-xs text-brand-fg transition-opacity duration-150 hover:opacity-90 disabled:opacity-50"
          >
            Salvar
          </button>
        </div>
      )}
    </div>
  );
}
