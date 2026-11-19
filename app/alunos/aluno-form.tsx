'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Unidade = { id: string; nome: string };

type AlunoEdit = {
  id: string;
  nome: string;
  cpf: string | null;
  email: string | null;
  telefone: string | null;
  endereco: string | null;
  dataNascimento: string | null;
  unidadeId: string | null;
  ativo: boolean;
};

export function AlunoForm({
  unidades,
  aluno,
}: {
  unidades: Unidade[];
  aluno: AlunoEdit | null;
}) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      nome: String(fd.get('nome') ?? '').trim(),
      cpf: String(fd.get('cpf') ?? '').trim() || null,
      email: String(fd.get('email') ?? '').trim() || null,
      telefone: String(fd.get('telefone') ?? '').trim() || null,
      endereco: String(fd.get('endereco') ?? '').trim() || null,
      dataNascimento: String(fd.get('dataNascimento') ?? '').trim() || null,
      unidadeId: String(fd.get('unidadeId') ?? '').trim() || null,
      ativo: fd.get('ativo') === 'on',
    };

    try {
      const url = aluno ? `/api/alunos/${aluno.id}` : '/api/alunos';
      const res = await fetch(url, {
        method: aluno ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? 'Falha ao salvar aluno.');
      }
      router.push('/alunos');
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro inesperado.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs text-fg-muted" htmlFor="nome">
          Nome completo *
        </label>
        <Input
          id="nome"
          name="nome"
          required
          defaultValue={aluno?.nome ?? ''}
          placeholder="Ex.: Maria Silva"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-fg-muted" htmlFor="cpf">
          CPF
        </label>
        <Input id="cpf" name="cpf" defaultValue={aluno?.cpf ?? ''} />
      </div>
      <div>
        <label
          className="mb-1 block text-xs text-fg-muted"
          htmlFor="dataNascimento"
        >
          Data de nascimento
        </label>
        <Input
          id="dataNascimento"
          name="dataNascimento"
          type="date"
          defaultValue={aluno?.dataNascimento ?? ''}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-fg-muted" htmlFor="email">
          E-mail
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={aluno?.email ?? ''}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-fg-muted" htmlFor="telefone">
          Telefone
        </label>
        <Input
          id="telefone"
          name="telefone"
          defaultValue={aluno?.telefone ?? ''}
        />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs text-fg-muted" htmlFor="endereco">
          Endereço
        </label>
        <Input
          id="endereco"
          name="endereco"
          defaultValue={aluno?.endereco ?? ''}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-fg-muted" htmlFor="unidadeId">
          Unidade
        </label>
        <select
          id="unidadeId"
          name="unidadeId"
          defaultValue={aluno?.unidadeId ?? ''}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <option value="">Sem unidade</option>
          {unidades.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nome}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-end">
        <label className="flex items-center gap-2 text-sm text-fg">
          <input
            type="checkbox"
            name="ativo"
            defaultChecked={aluno ? aluno.ativo : true}
            className="h-4 w-4 rounded border-border bg-surface text-brand focus-visible:ring-2 focus-visible:ring-brand"
          />
          Aluno ativo
        </label>
      </div>

      {erro && (
        <p className="sm:col-span-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {erro}
        </p>
      )}

      <div className="sm:col-span-2 flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={() => router.push('/alunos')}
        >
          Cancelar
        </Button>
        <Button type="submit" variant="primary" size="md" disabled={enviando}>
          {enviando ? 'Salvando…' : aluno ? 'Salvar alterações' : 'Cadastrar aluno'}
        </Button>
      </div>
    </form>
  );
}
