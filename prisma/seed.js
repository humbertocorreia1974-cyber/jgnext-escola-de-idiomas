const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

const senha = bcrypt.hashSync('Demo@1234', 10);

async function main() {
  const roles = ['dono', 'coordenacao', 'secretaria', 'aluno'];
  for (const role of roles) {
    await prisma.user.upsert({
      where: { email: `${role}@demo.app` },
      update: {},
      create: { email: `${role}@demo.app`, name: role.charAt(0).toUpperCase() + role.slice(1), passwordHash: senha, role, plan: 'pro', termsAcceptedAt: new Date() },
    });
  }
  await prisma.user.upsert({ where: { email: 'jogador@demo.app' }, update: {}, create: { email: 'jogador@demo.app', name: 'Jogador Demo', passwordHash: senha, role: 'user', plan: 'free', termsAcceptedAt: new Date() } });

  const dono = await prisma.user.findUnique({ where: { email: 'dono@demo.app' } });
  const coord = await prisma.user.findUnique({ where: { email: 'coordenacao@demo.app' } });
  const alunoUser = await prisma.user.findUnique({ where: { email: 'aluno@demo.app' } });

  if ((await prisma.unidade.count()) === 0) {
    await prisma.unidade.createMany({ data: [
      { nome: 'Unidade Centro - SP', cnpj: '12.345.678/0001-01', endereco: 'Av. Paulista, 1000', cidade: 'São Paulo', uf: 'SP', telefone: '(11) 3000-1000', email: 'centro@jgnext.com.br' },
      { nome: 'Unidade Copacabana - RJ', cnpj: '12.345.678/0002-02', endereco: 'Av. Atlântica, 500', cidade: 'Rio de Janeiro', uf: 'RJ', telefone: '(21) 3000-2000', email: 'copacabana@jgnext.com.br' },
      { nome: 'Unidade Savassi - MG', cnpj: '12.345.678/0003-03', endereco: 'Rua Antônio de Albuquerque, 300', cidade: 'Belo Horizonte', uf: 'MG', telefone: '(31) 3000-3000', email: 'savassi@jgnext.com.br' },
    ]});
  }
  const unidades = await prisma.unidade.findMany();

  if ((await prisma.curso.count()) === 0) {
    await prisma.curso.createMany({ data: [
      { nome: 'Inglês Geral', idioma: 'Inglês', descricao: 'Curso completo de inglês do básico ao avançado', cargaHorariaTotal: 360, frequenciaMinima: 75 },
      { nome: 'Espanhol Geral', idioma: 'Espanhol', descricao: 'Curso de espanhol com foco em conversação', cargaHorariaTotal: 300, frequenciaMinima: 75 },
      { nome: 'Francês Básico', idioma: 'Francês', descricao: 'Introdução ao idioma francês', cargaHorariaTotal: 240, frequenciaMinima: 70 },
    ]});
  }
  const cursos = await prisma.curso.findMany();

  if ((await prisma.nivel.count()) === 0) {
    const niveisData = [];
    for (const c of cursos) {
      for (let i = 1; i <= 4; i++) niveisData.push({ nome: `Nível ${i}`, ordem: i, cargaHoraria: 60, cursoId: c.id });
    }
    await prisma.nivel.createMany({ data: niveisData });
  }
  const niveis = await prisma.nivel.findMany();

  if ((await prisma.professor.count()) === 0) {
    await prisma.professor.createMany({ data: [
      { nome: 'Ana Carolina Silva', cpf: '111.111.111-11', email: 'ana.silva@jgnext.com.br', telefone: '(11) 91111-1111', especialidades: 'Inglês, TOEFL', valorHora: 85.00, unidadeId: unidades[0].id },
      { nome: 'Bruno Costa Oliveira', cpf: '222.222.222-22', email: 'bruno.oliveira@jgnext.com.br', telefone: '(21) 92222-2222', especialidades: 'Espanhol, DELE', valorHora: 80.00, unidadeId: unidades[1].id },
      { nome: 'Carla Mendes Souza', cpf: '333.333.333-33', email: 'carla.souza@jgnext.com.br', telefone: '(31) 93333-3333', especialidades: 'Francês, DELF', valorHora: 90.00, unidadeId: unidades[2].id },
      { nome: 'Diego Ferreira Lima', cpf: '444.444.444-44', email: 'diego.lima@jgnext.com.br', telefone: '(11) 94444-4444', especialidades: 'Inglês, Business', valorHora: 95.00, unidadeId: unidades[0].id },
    ]});
  }
  const professores = await prisma.professor.findMany();

  if ((await prisma.responsavel.count()) === 0) {
    await prisma.responsavel.createMany({ data: [
      { nome: 'Marcos Pereira Santos', cpf: '555.555.555-55', email: 'marcos.santos@email.com', telefone: '(11) 95555-5555', parentesco: 'Pai' },
      { nome: 'Juliana Rocha Alves', cpf: '666.666.666-66', email: 'juliana.alves@email.com', telefone: '(21) 96666-6666', parentesco: 'Mãe' },
    ]});
  }
  const responsaveis = await prisma.responsavel.findMany();

  if ((await prisma.aluno.count()) === 0) {
    await prisma.aluno.createMany({ data: [
      { userId: alunoUser.id, nome: 'Aluno Demo', cpf: '777.777.777-77', dataNascimento: new Date('2000-05-15'), email: 'aluno@demo.app', telefone: '(11) 97777-7777', endereco: 'Rua das Flores, 100, São Paulo/SP', unidadeId: unidades[0].id },
      { nome: 'Pedro Henrique Santos', cpf: '888.888.888-88', dataNascimento: new Date('2010-03-20'), email: 'pedro.santos@email.com', telefone: '(11) 98888-8888', endereco: 'Rua A, 200, São Paulo/SP', responsavelId: responsaveis[0].id, unidadeId: unidades[0].id },
      { nome: 'Maria Eduarda Alves', cpf: '999.999.999-99', dataNascimento: new Date('2012-08-10'), email: 'maria.alves@email.com', telefone: '(21) 99999-9999', endereco: 'Rua B, 300, Rio de Janeiro/RJ', responsavelId: responsaveis[1].id, unidadeId: unidades[1].id },
      { nome: 'Lucas Gabriel Rocha', cpf: '101.101.101-10', dataNascimento: new Date('2005-11-25'), email: 'lucas.rocha@email.com', telefone: '(31) 91010-1010', endereco: 'Rua C, 400, Belo Horizonte/MG', unidadeId: unidades[2].id },
      { nome: 'Sofia Ribeiro Castro', cpf: '202.202.202-20', dataNascimento: new Date('2008-02-14'), email: 'sofia.castro@email.com', telefone: '(11) 92020-2020', endereco: 'Rua D, 500, São Paulo/SP', unidadeId: unidades[0].id },
      { nome: 'Rafael Nunes Barbosa', cpf: '303.303.303-30', dataNascimento: new Date('1998-07-30'), email: 'rafael.barbosa@email.com', telefone: '(21) 93030-3030', endereco: 'Rua E, 600, Rio de Janeiro/RJ', unidadeId: unidades[1].id },
    ]});
  }
  const alunos = await prisma.aluno.findMany();

  if ((await prisma.turma.count()) === 0) {
    await prisma.turma.createMany({ data: [
      { codigo: 'ING-A1-2025', nome: 'Inglês A1 - Manhã', cursoId: cursos[0].id, nivelId: niveis.find(n => n.cursoId === cursos[0].id && n.ordem === 1).id, unidadeId: unidades[0].id, professorId: professores[0].id, capacidade: 15, dataInicio: new Date('2025-02-01'), dataFim: new Date('2025-06-30'), status: 'em_andamento' },
      { codigo: 'ING-A2-2025', nome: 'Inglês A2 - Tarde', cursoId: cursos[0].id, nivelId: niveis.find(n => n.cursoId === cursos[0].id && n.ordem === 2).id, unidadeId: unidades[0].id, professorId: professores[3].id, capacidade: 12, dataInicio: new Date('2025-02-01'), dataFim: new Date('2025-06-30'), status: 'em_andamento' },
      { codigo: 'ESP-A1-2025', nome: 'Espanhol A1 - Noite', cursoId: cursos[1].id, nivelId: niveis.find(n => n.cursoId === cursos[1].id && n.ordem === 1).id, unidadeId: unidades[1].id, professorId: professores[1].id, capacidade: 15, dataInicio: new Date('2025-03-01'), dataFim: new Date('2025-07-31'), status: 'em_andamento' },
      { codigo: 'FRA-A1-2025', nome: 'Francês A1 - Manhã', cursoId: cursos[2].id, nivelId: niveis.find(n => n.cursoId === cursos[2].id && n.ordem === 1).id, unidadeId: unidades[2].id, professorId: professores[2].id, capacidade: 10, dataInicio: new Date('2025-03-15'), dataFim: new Date('2025-08-15'), status: 'aberta' },
    ]});
  }
  const turmas = await prisma.turma.findMany();

  if ((await prisma.horario.count()) === 0) {
    await prisma.horario.createMany({ data: [
      { turmaId: turmas[0].id, diaSemana: 1, horaInicio: '08:00', horaFim: '10:00', sala: 'Sala 101' },
      { turmaId: turmas[0].id, diaSemana: 3, horaInicio: '08:00', horaFim: '10:00', sala: 'Sala 101' },
      { turmaId: turmas[1].id, diaSemana: 2, horaInicio: '14:00', horaFim: '16:00', sala: 'Sala 102' },
      { turmaId: turmas[1].id, diaSemana: 4, horaInicio: '14:00', horaFim: '16:00', sala: 'Sala 102' },
      { turmaId: turmas[2].id, diaSemana: 1, horaInicio: '19:00', horaFim: '21:00', sala: 'Sala 201' },
      { turmaId: turmas[2].id, diaSemana: 3, horaInicio: '19:00', horaFim: '21:00', sala: 'Sala 201' },
    ]});
  }

  if ((await prisma.matricula.count()) === 0) {
    await prisma.matricula.createMany({ data: [
      { alunoId: alunos[0].id, turmaId: turmas[0].id, nivelId: turmas[0].nivelId, status: 'ativa', valorMensal: 450.00, desconto: 0 },
      { alunoId: alunos[1].id, turmaId: turmas[0].id, nivelId: turmas[0].nivelId, status: 'ativa', valorMensal: 450.00, desconto: 10 },
      { alunoId: alunos[2].id, turmaId: turmas[2].id, nivelId: turmas[2].nivelId, status: 'ativa', valorMensal: 420.00, desconto: 0 },
      { alunoId: alunos[3].id, turmaId: turmas[3].id, nivelId: turmas[3].nivelId, status: 'ativa', valorMensal: 480.00, desconto: 5 },
      { alunoId: alunos[4].id, turmaId: turmas[1].id, nivelId: turmas[1].nivelId, status: 'ativa', valorMensal: 450.00, desconto: 0 },
      { alunoId: alunos[5].id, turmaId: turmas[2].id, nivelId: turmas[2].nivelId, status: 'ativa', valorMensal: 420.00, desconto: 0 },
    ]});
  }
  const matriculas = await prisma.matricula.findMany();

  if ((await prisma.contrato.count()) === 0) {
    await prisma.contrato.createMany({ data: [
      { numero: 'CT-2025-001', matriculaId: matriculas[0].id, alunoId: alunos[0].id, unidadeId: unidades[0].id, cursoId: cursos[0].id, criadoPorId: coord.id, dataInicio: new Date('2025-02-01'), dataFim: new Date('2025-12-31'), valorTotal: 5400.00, parcelas: 12, status: 'ativo', aceitoEm: new Date('2025-01-25') },
      { numero: 'CT-2025-002', matriculaId: matriculas[1].id, alunoId: alunos[1].id, unidadeId: unidades[0].id, cursoId: cursos[0].id, criadoPorId: coord.id, dataInicio: new Date('2025-02-01'), dataFim: new Date('2025-12-31'), valorTotal: 4860.00, parcelas: 12, status: 'ativo', aceitoEm: new Date('2025-01-26') },
      { numero: 'CT-2025-003', matriculaId: matriculas[2].id, alunoId: alunos[2].id, unidadeId: unidades[1].id, cursoId: cursos[1].id, criadoPorId: coord.id, dataInicio: new Date('2025-03-01'), dataFim: new Date('2025-12-31'), valorTotal: 4200.00, parcelas: 10, status: 'ativo', aceitoEm: new Date('2025-02-20') },
      { numero: 'CT-2025-004', matriculaId: matriculas[3].id, alunoId: alunos[3].id, unidadeId: unidades[2].id, cursoId: cursos[2].id, criadoPorId: coord.id, dataInicio: new Date('2025-03-15'), dataFim: new Date('2025-12-31'), valorTotal: 4560.00, parcelas: 10, status: 'ativo', aceitoEm: new Date('2025-03-01') },
    ]});
  }
  const contratos = await prisma.contrato.findMany();

  if ((await prisma.mensalidade.count()) === 0) {
    const mensalidadesData = [];
    for (const m of matriculas) {
      const contrato = contratos.find(c => c.matriculaId === m.id);
      for (let mes = 1; mes <= 6; mes++) {
        const comp = `2025-${String(mes).padStart(2, '0')}`;
        const valor = Number(m.valorMensal);
        const desc = valor * (m.desconto / 100);
        mensalidadesData.push({ matriculaId: m.id, contratoId: contrato?.id, alunoId: m.alunoId, unidadeId: unidades[0].id, competencia: comp, valor, desconto: desc, valorFinal: valor - desc, vencimento: new Date(`2025-${String(mes).padStart(2, '0')}-10`), status: mes <= 3 ? 'paga' : 'pendente', pagoEm: mes <= 3 ? new Date(`2025-${String(mes).padStart(2, '0')}-08`) : null });
      }
    }
    await prisma.mensalidade.createMany({ data: mensalidadesData });
  }

  if ((await prisma.aula.count()) === 0) {
    const aulasData = [];
    for (const t of turmas) {
      for (let i = 0; i < 8; i++) {
        const d = new Date('2025-03-01'); d.setDate(d.getDate() + i * 7);
        aulasData.push({ turmaId: t.id, professorId: t.professorId, data: d, tema: `Aula ${i + 1} - ${t.nome}`, conteudo: `Conteúdo programático da aula ${i + 1}`, status: i < 6 ? 'realizada' : 'planejada' });
      }
    }
    await prisma.aula.createMany({ data: aulasData });
  }
  const aulas = await prisma.aula.findMany();

  if ((await prisma.presenca.count()) === 0) {
    const presencasData = [];
    for (const a of aulas.filter(x => x.status === 'realizada')) {
      const mat = matriculas.filter(m => m.turmaId === a.turmaId);
      for (const m of mat) presencasData.push({ aulaId: a.id, alunoId: m.alunoId, presente: Math.random() > 0.15, justificada: false });
    }
    await prisma.presenca.createMany({ data: presencasData });
  }

  if ((await prisma.prova.count()) === 0) {
    await prisma.prova.createMany({ data: [
      { titulo: 'Prova Bimestral Inglês A1', descricao: 'Avaliação do primeiro bimestre', cursoId: cursos[0].id, unidadeId: unidades[0].id, professorId: professores[0].id, criadoPorId: dono.id, dataAplicacao: new Date('2025-04-15'), peso: 1, notaMaxima: 10 },
      { titulo: 'Prova Bimestral Espanhol A1', descricao: 'Avaliação do primeiro bimestre', cursoId: cursos[1].id, unidadeId: unidades[1].id, professorId: professores[1].id, criadoPorId: dono.id, dataAplicacao: new Date('2025-04-20'), peso: 1, notaMaxima: 10 },
      { titulo: 'Prova Bimestral Francês A1', descricao: 'Avaliação do primeiro bimestre', cursoId: cursos[2].id, unidadeId: unidades[2].id, professorId: professores[2].id, criadoPorId: dono.id, dataAplicacao: new Date('2025-04-25'), peso: 1, notaMaxima: 10 },
    ]});
  }
  const provas = await prisma.prova.findMany();

  if ((await prisma.nota.count()) === 0) {
    const notasData = [];
    for (const p of provas) {
      const mat = matriculas.filter(m => m.turmaId && turmas.find(t => t.id === m.turmaId)?.cursoId === p.cursoId);
      for (const m of mat) notasData.push({ provaId: p.id, alunoId: m.alunoId, valor: Math.round((6 + Math.random() * 4) * 10) / 10, observacao: 'Bom desempenho' });
    }
    await prisma.nota.createMany({ data: notasData });
  }

  if ((await prisma.boletim.count()) === 0) {
    await prisma.boletim.createMany({ data: [
      { alunoId: alunos[0].id, matriculaId: matriculas[0].id, periodo: '2025-1', mediaFinal: 8.5, frequencia: 92, situacao: 'aprovado', observacoes: 'Excelente participação', emitidoEm: new Date('2025-06-30') },
      { alunoId: alunos[1].id, matriculaId: matriculas[1].id, periodo: '2025-1', mediaFinal: 7.8, frequencia: 88, situacao: 'aprovado', observacoes: 'Bom desempenho', emitidoEm: new Date('2025-06-30') },
      { alunoId: alunos[2].id, matriculaId: matriculas[2].id, periodo: '2025-1', mediaFinal: 9.2, frequencia: 95, situacao: 'aprovado', observacoes: 'Destaque da turma', emitidoEm: new Date('2025-06-30') },
      { alunoId: alunos[4].id, matriculaId: matriculas[4].id, periodo: '2025-1', mediaFinal: 6.5, frequencia: 78, situacao: 'recuperacao', observacoes: 'Precisa melhorar', emitidoEm: new Date('2025-06-30') },
    ]});
  }

  if ((await prisma.materialDidatico.count()) === 0) {
    await prisma.materialDidatico.createMany({ data: [
      { titulo: 'Apostila Inglês A1', descricao: 'Material completo do nível A1', tipo: 'pdf', url: 'https://materiais.jgnext.com.br/ingles-a1.pdf', cursoId: cursos[0].id, unidadeId: unidades[0].id, autorId: dono.id, professorId: professores[0].id, publico: true },
      { titulo: 'Vídeo Aula - Verb To Be', descricao: 'Aula gravada sobre verb to be', tipo: 'video', url: 'https://materiais.jgnext.com.br/verb-to-be.mp4', cursoId: cursos[0].id, unidadeId: unidades[0].id, autorId: dono.id, professorId: professores[0].id, publico: true },
      { titulo: 'Apostila Espanhol A1', descricao: 'Material completo do nível A1', tipo: 'pdf', url: 'https://materiais.jgnext.com.br/espanhol-a1.pdf', cursoId: cursos[1].id, unidadeId: unidades[1].id, autorId: dono.id, professorId: professores[1].id, publico: true },
      { titulo: 'Áudio - Pronunciación', descricao: 'Exercícios de pronúncia', tipo: 'audio', url: 'https://materiais.jgnext.com.br/pronunciacion.mp3', cursoId: cursos[1].id, unidadeId: unidades[1].id, autorId: dono.id, professorId: professores[1].id, publico: true },
      { titulo: 'Apostila Francês A1', descricao: 'Material completo do nível A1', tipo: 'pdf', url: 'https://materiais.jgnext.com.br/frances-a1.pdf', cursoId: cursos[2].id, unidadeId: unidades[2].id, autorId: dono.id, professorId: professores[2].id, publico: true },
    ]});
  }

  if ((await prisma.reposicaoAula.count()) === 0) {
    await prisma.reposicaoAula.createMany({ data: [
      { alunoId: alunos[0].id, aulaOrigemId: aulas[0].id, turmaId: turmas[0].id, professorId: professores[0].id, unidadeId: unidades[0].id, solicitadoPorId: alunoUser.id, dataReposicao: new Date('2025-05-10'), motivo: 'Consulta médica', status: 'agendada' },
      { alunoId: alunos[1].id, aulaOrigemId: aulas[1].id, turmaId: turmas[0].id, professorId: professores[0].id, unidadeId: unidades[0].id, solicitadoPorId: coord.id, dataReposicao: new Date('2025-05-12'), motivo: 'Viagem familiar', status: 'pendente' },
      { alunoId: alunos[2].id, aulaOrigemId: aulas[16].id, turmaId: turmas[2].id, professorId: professores[1].id, unidadeId: unidades[1].id, solicitadoPorId: coord.id, dataReposicao: new Date('2025-05-15'), motivo: 'Atestado médico', status: 'realizada' },
    ]});
  }

  if ((await prisma.cargaHoraria.count()) === 0) {
    await prisma.cargaHoraria.createMany({ data: [
      { professorId: professores[0].id, mes: 3, ano: 2025, horas: 40, valorHora: 85.00, valorTotal: 3400.00 },
      { professorId: professores[1].id, mes: 3, ano: 2025, horas: 36, valorHora: 80.00, valorTotal: 2880.00 },
      { professorId: professores[2].id, mes: 3, ano: 2025, horas: 32, valorHora: 90.00, valorTotal: 2880.00 },
      { professorId: professores[3].id, mes: 3, ano: 2025, horas: 38, valorHora: 95.00, valorTotal: 3610.00 },
    ]});
  }

  if ((await prisma.folhaPagamento.count()) === 0) {
    await prisma.folhaPagamento.createMany({ data: [
      { professorId: professores[0].id, userId: dono.id, unidadeId: unidades[0].id, competencia: '2025-03', horasTrabalhadas: 40, valorHora: 85.00, valorBruto: 3400.00, descontos: 340.00, valorLiquido: 3060.00, status: 'pago', pagoEm: new Date('2025-04-05') },
      { professorId: professores[1].id, userId: dono.id, unidadeId: unidades[1].id, competencia: '2025-03', horasTrabalhadas: 36, valorHora: 80.00, valorBruto: 2880.00, descontos: 288.00, valorLiquido: 2592.00, status: 'pago', pagoEm: new Date('2025-04-05') },
      { professorId: professores[2].id, userId: dono.id, unidadeId: unidades[2].id, competencia: '2025-03', horasTrabalhadas: 32, valorHora: 90.00, valorBruto: 2880.00, descontos: 288.00, valorLiquido: 2592.00, status: 'pendente' },
      { professorId: professores[3].id, userId: dono.id, unidadeId: unidades[0].id, competencia: '2025-03', horasTrabalhadas: 38, valorHora: 95.00, valorBruto: 3610.00, descontos: 361.00, valorLiquido: 3249.00, status: 'pendente' },
    ]});
  }

  if ((await prisma.pagamento.count()) === 0) {
    await prisma.pagamento.createMany({ data: [
      { alunoId: alunos[0].id, matriculaId: matriculas[0].id, registradoPorId: dono.id, valor: 450.00, metodo: 'pix', status: 'confirmado', dataPagamento: new Date('2025-03-08'), referencia: 'PIX-2025-001' },
      { alunoId: alunos[1].id, matriculaId: matriculas[1].id, registradoPorId: dono.id, valor: 405.00, metodo: 'cartao', status: 'confirmado', dataPagamento: new Date('2025-03-09'), referencia: 'CARD-2025-002' },
      { alunoId: alunos[2].id, matriculaId: matriculas[2].id, registradoPorId: coord.id, valor: 420.00, metodo: 'boleto', status: 'confirmado', dataPagamento: new Date('2025-03-10'), referencia: 'BOL-2025-003' },
      { alunoId: alunos[3].id, matriculaId: matriculas[3].id, registradoPorId: coord.id, valor: 456.00, metodo: 'pix', status: 'pendente', dataPagamento: null, referencia: 'PIX-2025-004' },
    ]});
  }

  if ((await prisma.notificacao.count()) === 0) {
    await prisma.notificacao.createMany({ data: [
      { userId: alunoUser.id, titulo: 'Bem-vindo à JGNEXT', mensagem: 'Sua matrícula foi confirmada com sucesso!', tipo: 'info', lida: false },
      { userId: alunoUser.id, titulo: 'Mensalidade próxima', mensagem: 'Sua mensalidade vence em 10 dias.', tipo: 'aviso', lida: false },
      { userId: dono.id, titulo: 'Nova matrícula', mensagem: 'Um novo aluno se matriculou no curso de Inglês.', tipo: 'info', lida: true },
      { userId: coord.id, titulo: 'Folha de pagamento', mensagem: 'A folha de pagamento de março está pendente.', tipo: 'aviso', lida: false },
    ]});
  }

  if ((await prisma.project.count()) === 0) {
    await prisma.project.createMany({ data: [
      { name: 'Sistema de Gestão Escolar', ownerId: dono.id },
      { name: 'Portal do Aluno', ownerId: coord.id },
    ]});
  }
}

main().then(()=>prisma.$disconnect()).catch(async(e)=>{console.error('[seed] ERRO:',e.message);await prisma.$disconnect();process.exit(1);});