'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardBody, CardTitle } from '@/components/ui/card';

type Aluno = { id: string; nome: string; cpf: string | null };
type Turma = {
  id: string;
  codigo: string;
  nome: string;
  capacidade: number;
  nivelId: string;
  nivel: { nome: string; curso: { nome: string } };
  _count: { matriculas: number };
};
type Nivel = { id: string; nome: string; curso: { nome: string } };

export function MatriculaFormClient() {
  const router = useRouter();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [niveis, setNiveis] = useState<Nivel[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [alunoId, setAlunoId] = useState('');
  const [turmaId, setTurmaId] = useState('');
  const [nivelId, setNivelId] = useState('');
  const [valorMensal, setValorMensal] = useState('450');
  const [desconto, setDesconto] = useState('0');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    fetch('/api/matriculas/opcoes')
      .then((r) => r.json())
      .then((d) => {
        setAlunos(d.alunos ?? []);
        setTurmas(d.turmas ?? []);
        setNiveis(d.niveis ?? []);
      })
      .catch(() => setErro('Falha ao carregar opções'))
      .finally(() => setCarregando(false));
  }, []);

  const turmaSelecionada = useMemo(
    () => turmas.find((t) => t.id === turmaId),
    [turmas, turmaId],
  );

  useEffect(() => {
    if (turmaSelecionada) setNivelId(turmaSelecionada.nivelId);
  }, [turmaSelecionada]);

  const valorFinal = useMemo(() => {
    const v = Number(valorMensal) || 0;
    const d = Number(desconto) || 0;
    return Math.max(v - d, 0);
  }, [valorMensal, desconto]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!alunoId || !turmaId || !nivelId) {
      setErro('Selecione aluno, turma e nível.');
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch('/api/matriculas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alunoId,
          turmaId,
          nivelId,
          valorMensal: Number(valorMensal),
          desconto: Number(desconto),
          observacoes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Erro ao matricular');
      setAlunoId('');
      setTurmaId('');
      setNivelId('');
      setObservacoes('');
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Card>
      <CardBody>
        <CardTitle>Nova matrícula</CardTitle>
        <form onSubmit={onSubmit} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-fg-muted">
            Aluno
            <select
              value={alunoId}
              onChange={(e) => setAlunoId(e.target.value)}
              disabled={carregando}
              className="rounded-md border border-border bg-surface px-3 py-2 text-fg outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <option value="">Selecione…</option>
              {alunos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm text-fg-muted">
            Turma
            <select
              value={turmaId}
              onChange={(e) => setTurmaId(e.target.value)}
              disabled={carregando}
              className="rounded-md border border-border bg-surface px-3 py-2 text-fg outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <option value="">Selecione…</option>
              {turmas.map((t) => {
                const cheia = t._count.matriculas >= t.capacidade;
                return (
                  <option key={t.id} value={t.id} disabled={cheia}>
                    {t.codigo} — {t.nome} ({t.nivel.curso.nome}/{t.nivel.nome}){' '}
                    {cheia ? '· LOTADA' : `· ${t._count.matriculas}/${t.capacidade}`}
                  </option>
                );
              })}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm text-fg-muted">
            Nível
            <select
              value={nivelId}
              onChange={(e) => setNivelId(e.target.value)}
              disabled={carregando || !!turmaSelecionada}
              className="rounded-md border border-border bg-surface px-3 py-2 text-fg outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-60"
            >
              <option value="">Selecione…</option>
              {niveis.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.curso.nome} — {n.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm text-fg-muted">
            Valor mensal (R$)
            <Input
              type="number"
              min="0"
              step="0.01"
              value={valorMensal}
              onChange={(e) => setValorMensal(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-fg-muted">
            Desconto (R$)
            <Input
              type="number"
              min="0"
              step="0.01"
              value={desconto}
              onChange={(e) => setDesconto(e.target.value)}
            />
          </label>

          <div className="flex flex-col gap-1 text-sm text-fg-muted">
            Valor final
            <span className="rounded-md border border-border bg-surface/70 px-3 py-2 text-fg">
              R$ {valorFinal.toFixed(2)}
            </span>
          </div>

          <label className="flex flex-col gap-1 text-sm text-fg-muted md:col-span-2">
            Observações
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
              className="rounded-md border border-border bg-surface px-3 py-2 text-fg outline-none focus-visible:ring-2 focus-visible:ring-brand"
            />
          </label>

          {erro && (
            <p className="md:col-span-2 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {erro}
            </p>
          )}

          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" disabled={enviando || carregando}>
              {enviando ? 'Matriculando…' : 'Matricular aluno'}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
