import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { NovoProfessorForm } from './novo-professor-form';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Novo professor | JGNEXT Escola de Idiomas',
  description: 'Cadastre um novo professor vinculado a uma unidade.',
  openGraph: {
    title: 'Novo professor | JGNEXT Escola de Idiomas',
    description: 'Cadastre um novo professor vinculado a uma unidade.',
  },
};

export default async function NovoProfessorPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const role = (session.user as { role?: string }).role;
  if (!['dono', 'coordenacao', 'secretaria'].includes(role ?? '')) redirect('/');

  const unidades = await prisma.unidade.findMany({ where: { ativa: true }, orderBy: { nome: 'asc' } });

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Card>
        <CardBody>
          <CardTitle>Novo professor</CardTitle>
          <p className="mt-1 mb-6 text-sm text-fg-muted">
            Preencha os dados básicos. Você poderá vincular turmas e carga horária depois.
          </p>
          <NovoProfessorForm unidades={unidades.map((u) => ({ id: u.id, nome: u.nome }))} />
        </CardBody>
      </Card>
    </div>
  );
}
