'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCheck } from 'lucide-react';

export function MarcarTodasButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);

  async function marcarTodas() {
    setLoading(true);
    try {
      await fetch('/api/notificacoes/marcar-todas-lidas', { method: 'POST' });
      startTransition(() => router.refresh());
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={marcarTodas}
      disabled={loading || pending}
    >
      <CheckCheck className="h-4 w-4" />
      <span className="ml-1">Marcar todas como lidas</span>
    </Button>
  );
}
