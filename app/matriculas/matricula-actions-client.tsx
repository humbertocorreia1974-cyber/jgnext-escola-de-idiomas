'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

type Status = 'ativa' | 'trancada' | 'cancelada' | 'concluida';

export function MatriculaActionsClient({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  async function mudar(novo: Status) {
    setErro(null);
    const res = await fetch(`/api/matriculas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: novo }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErro(d?.error ?? 'Erro');
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === 'ativa' && (
        <>
          <Button size="sm" variant="secondary" disabled={pending} onClick={() => mudar('trancada')}>
            Trancar
          </Button>
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => mudar('concluida')}>
            Concluir
          </Button>
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => mudar('cancelada')}>
            Cancelar
          </Button>
        </>
      )}
      {status === 'trancada' && (
        <>
          <Button size="sm" disabled={pending} onClick={() => mudar('ativa')}>
            Reativar
          </Button>
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => mudar('cancelada')}>
            Cancelar
          </Button>
        </>
      )}
      {(status === 'cancelada' || status === 'concluida') && (
        <Button size="sm" variant="secondary" disabled={pending} onClick={() => mudar('ativa')}>
          Reabrir
        </Button>
      )}
      {erro && <span className="text-xs text-red-400">{erro}</span>}
    </div>
  );
}
