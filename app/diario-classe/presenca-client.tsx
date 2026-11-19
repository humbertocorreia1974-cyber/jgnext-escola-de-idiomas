'use client';

import { useEffect, useState } from 'react';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type AulaOpt = { id: string; label: string };
type AlunoLinha = { id: string; nome: string; presente: boolean; justificada: boolean };

export function PresencaClient({ aulas }: { aulas: AulaOpt[] }) {
  const [aulaId, setAulaId] = useState(aulas[0]?.id ?? '');
  const [linhas, setLinhas] = useState<AlunoLinha[]>([]);
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!aulaId) return;
    let cancel = false;
    setLoading(true);
    setMsg(null);
    fetch(`/api/aulas/${aulaId}/presencas`)
      .then((r) => r.json())
      .then((data: { alunos: AlunoLinha[] }) => {
        if (!cancel) setLinhas(data.alunos ?? []);
      })
      .catch(() => {
        if (!cancel) setMsg('Falha ao carregar presenças');
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [aulaId]);

  function toggle(id: string, campo: 'presente' | 'justificada') {
    setLinhas((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [campo]: !l[campo] } : l)),
    );
  }

  async function salvar() {
    if (!aulaId) return;
    setSalvando(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/aulas/${aulaId}/presencas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presencas: linhas }),
      });
      if (!res.ok) throw new Error('Falha ao salvar');
      setMsg('Presenças salvas com sucesso.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Erro');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Card>
      <CardTitle>Lançar presenças</CardTitle>
      <CardBody>
        <label className="flex flex-col gap-1 text-xs text-fg-muted">
          Aula
          <select
            value={aulaId}
            onChange={(e) => setAulaId(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
          >
            {aulas.length === 0 && <option value="">Sem aulas</option>}
            {aulas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-4 max-h-72 overflow-y-auto rounded-md border border-border">
          {loading ? (
            <p className="p-3 text-xs text-fg-muted">Carregando…</p>
          ) : linhas.length === 0 ? (
            <p className="p-3 text-xs text-fg-muted">
              Nenhum aluno matriculado nesta turma.
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {linhas.map((l) => (
                <li
                  key={l.id}
                  className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                >
                  <span className="truncate">{l.nome}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggle(l.id, 'presente')}
                      className={`rounded-full px-2 py-0.5 text-xs transition-colors duration-150 ${
                        l.presente
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-surface border border-border text-fg-muted'
                      }`}
                    >
                      {l.presente ? 'Presente' : 'Falta'}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggle(l.id, 'justificada')}
                      className={`rounded-full px-2 py-0.5 text-xs transition-colors duration-150 ${
                        l.justificada
                          ? 'bg-brand/15 text-brand'
                          : 'bg-surface border border-border text-fg-muted'
                      }`}
                    >
                      Justif.
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {msg && <p className="mt-2 text-xs text-fg-muted">{msg}</p>}
        <Button
          type="button"
          variant="primary"
          size="md"
          className="mt-3 w-full"
          onClick={salvar}
          disabled={salvando || !aulaId || linhas.length === 0}
        >
          {salvando ? 'Salvando…' : 'Salvar presenças'}
        </Button>
      </CardBody>
    </Card>
  );
}
