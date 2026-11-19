'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ProvaForm({ cursos }: { cursos: { id: string; nome: string }[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      titulo: String(fd.get('titulo') || ''),
      descricao: String(fd.get('descricao') || ''),
      cursoId: String(fd.get('cursoId') || '') || null,
      dataAplicacao: String(fd.get('dataAplicacao') || '') || null,
      peso: Number(fd.get('peso') || 1),
      notaMaxima: Number(fd.get('notaMaxima') || 10),
    };
    const res = await fetch('/api/provas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setLoading(false);
    if (!res.ok) { setMsg('Não foi possível salvar.'); return; }
    setMsg('Prova criada.');
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  return (
    <Card>
      <CardTitle>Nova prova</CardTitle>
      <CardBody>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <Input name="titulo" placeholder="Título" required />
          <Input name="descricao" placeholder="Descrição (opcional)" />
          <select name="cursoId" defaultValue="" className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg">
            <option value="">Sem curso</option>
            {cursos.map((c) => (<option key={c.id} value={c.id}>{c.nome}</option>))}
          </select>
          <Input name="dataAplicacao" type="date" />
          <div className="grid grid-cols-2 gap-2">
            <Input name="peso" type="number" step="0.1" defaultValue="1" placeholder="Peso" />
            <Input name="notaMaxima" type="number" step="0.1" defaultValue="10" placeholder="Nota máx." />
          </div>
          <Button type="submit" disabled={loading}>{loading ? 'Salvando…' : 'Criar prova'}</Button>
          {msg && <p className="text-xs text-fg-muted">{msg}</p>}
        </form>
      </CardBody>
    </Card>
  );
}
