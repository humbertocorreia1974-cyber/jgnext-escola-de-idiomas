'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

export function MarcarLidaButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);

  async function marcar() {
    setLoading(true);
    try {
      await fetch(`/api/notificacoes/${id}/lida`, { method: 'PATCH' });
      startTransition(() => router.refresh());
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={marcar}
      disabled={loading || pending}
      aria-label="Marcar como lida"
    >
      <Check className="h-4 w-4" />
      <span className="ml-1 hidden sm:inline">Marcar lida</span>
    </Button>
  );
}
