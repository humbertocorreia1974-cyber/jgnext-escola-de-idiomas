'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function NotasForm({
  provaId,
  alunos,
  notasExistentes,
}: {
  provaId: string;
  alunos: { id: string; nome: string }[];
  notasExistentes: Record<string, number>;
}) {
  const router = useRouter();
  const [valores, setValores] = useState<Record<string, string>>(
    Object.fromEntries(alunos.map((a) => [a.id, notasExistentes[a.id]?.toString() ?? '']))
  );
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function salvar() {
    setLoading(true);
    setMsg(null);
    const notas = alunos
      .filter((a) => valores[a.id] !== '' && valores[a.id] != null)
      .map((a) => ({ alunoId: a.id, valor: Number(valores[a.id]) }));
    const res = await fetch(`/api/provas/${provaId}/notas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notas }),
    });
    setLoading(false);
    if (!res.ok) { setMsg('Falha ao salvar notas.'); return; }
    setMsg('Notas salvas.');
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="max-h-[520px] overflow-y-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-surface">
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
              <th className="py-2 pl-3">Aluno</th>
              <th className="py-2 pr-3 w-32">Nota</th>
            </tr>
          </thead>
          <tbody>
            {alunos.map((a) => (
              <tr key={a.id} className="border-b border-border/60">
                <td className="py-2 pl-3 text-fg">{a.nome}</td>
                <td className="py-2 pr-3">
                  <input
                    type="number"
                    step="0.1"
                    value={valores[a.id] ?? ''}
                    onChange={(e) => setValores((v) => ({ ...v, [a.id]: e.target.value }))}
                    className="w-24 rounded-md border border-border bg-surface px-2 py-1 text-sm text-fg"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={salvar} disabled={loading}>{loading ? 'Salvando…' : 'Salvar notas'}</Button>
        {msg && <p className="text-xs text-fg-muted">{msg}</p>}
      </div>
    </div>
  );
}
