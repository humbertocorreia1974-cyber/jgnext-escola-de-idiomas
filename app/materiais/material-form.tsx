'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function MaterialForm({ cursos }: { cursos: { id: string; nome: string }[] }) {
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
      tipo: String(fd.get('tipo') || 'pdf'),
      url: String(fd.get('url') || ''),
      cursoId: String(fd.get('cursoId') || '') || null,
      publico: fd.get('publico') === 'on',
    };
    const res = await fetch('/api/materiais', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setLoading(false);
    if (!res.ok) { setMsg('Não foi possível salvar.'); return; }
    setMsg('Material publicado.');
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  return (
    <Card>
      <CardTitle>Novo material</CardTitle>
      <CardBody>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <Input name="titulo" placeholder="Título" required />
          <Input name="url" placeholder="https://..." required />
          <Input name="descricao" placeholder="Descrição (opcional)" />
          <select name="tipo" defaultValue="pdf" className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg">
            <option value="pdf">PDF</option>
            <option value="video">Vídeo</option>
            <option value="audio">Áudio</option>
            <option value="link">Link</option>
            <option value="outro">Outro</option>
          </select>
          <select name="cursoId" defaultValue="" className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg">
            <option value="">Sem curso específico</option>
            {cursos.map((c) => (<option key={c.id} value={c.id}>{c.nome}</option>))}
          </select>
          <label className="flex items-center gap-2 text-xs text-fg-muted">
            <input type="checkbox" name="publico" /> Público (visível sem matrícula)
          </label>
          <Button type="submit" disabled={loading}>{loading ? 'Salvando…' : 'Publicar material'}</Button>
          {msg && <p className="text-xs text-fg-muted">{msg}</p>}
        </form>
      </CardBody>
    </Card>
  );
}
