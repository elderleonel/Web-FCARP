export type Curso = {
  id: string;
  nome: string;
  cargaHorariaTotal: number;
  corHex: string | null;
};

export type Professor = {
  id: string;
  nome: string;
  cidadeOrigem: string | null;
  especialidade: string | null;
};

export type Disciplina = {
  cargaHorariaTotal: number | null;
  id: string;
  nome: string;
};

export type EventoFeriado = {
  id: string;
  nome: string;
  data: string;
  tipo: 'feriado' | 'evento';
};

export type CronogramaModulo = {
  cargaHorariaDiaria: number | null;
  id: string;
  disciplinaId: string;
  diasSemana: number[];
  professorId: string | null;
  dataInicio: string;
  dataFim: string;
  cargaHorariaSemanal: number;
  sala: string | null;
  observacoes: string | null;
};

export type Intercurso = {
  cronogramaModuloId: string;
  cursoId: string;
};

export type CronogramaPublicoCard = {
  id: string;
  cargaHorariaSemanal: number;
  cursos: Curso[];
  dataFim: string;
  dataInicio: string;
  disciplinaNome: string;
  observacoes: string | null;
  professorCidadeOrigem: string | null;
  professorNome: string | null;
  sala: string | null;
};

export const fallbackCursos: Curso[] = [
  {
    id: 'curso-gti',
    nome: 'Gestao de Tecnologia da Informacao',
    cargaHorariaTotal: 360,
    corHex: '#163B65',
  },
  {
    id: 'curso-gestao',
    nome: 'Gestao Publica',
    cargaHorariaTotal: 360,
    corHex: '#2C6E91',
  },
  {
    id: 'curso-contabilidade',
    nome: 'Controladoria e Financas',
    cargaHorariaTotal: 420,
    corHex: '#6F7D8C',
  },
];

export const fallbackProfessores: Professor[] = [
  {
    id: 'prof-andre',
    nome: 'Prof. Andre Campos',
    cidadeOrigem: 'Cuiaba',
    especialidade: 'Infraestrutura e sistemas',
  },
  {
    id: 'prof-carla',
    nome: 'Profa. Carla Mendes',
    cidadeOrigem: 'Goiania',
    especialidade: 'Projetos e extensao',
  },
  {
    id: 'prof-luiza',
    nome: 'Profa. Luiza Torres',
    cidadeOrigem: 'Sao Paulo',
    especialidade: 'Seguranca da informacao',
  },
];

export const fallbackDisciplinas: Disciplina[] = [
  { id: 'disc-apc', nome: 'APC - Analise e Projeto de Computadores', cargaHorariaTotal: 72 },
  { id: 'disc-fso', nome: 'FSO - Fundamentos de Sistemas Operacionais', cargaHorariaTotal: 72 },
  { id: 'disc-ic', nome: 'IC - Infraestrutura em Computacao', cargaHorariaTotal: 72 },
];

export const fallbackEventos: EventoFeriado[] = [
  {
    id: 'evento-tech',
    nome: 'FCARP TECH',
    data: '2026-05-15',
    tipo: 'evento',
  },
  {
    id: 'feriado-corpus',
    nome: 'Corpus Christi',
    data: '2026-06-04',
    tipo: 'feriado',
  },
];

export const fallbackModulos: CronogramaModulo[] = [
  {
    id: 'modulo-1',
    cargaHorariaDiaria: 4,
    disciplinaId: 'disc-apc',
    diasSemana: [1, 2, 3, 4, 5],
    professorId: 'prof-andre',
    dataInicio: '2026-04-20',
    dataFim: '2026-04-24',
    cargaHorariaSemanal: 20,
    sala: 'Sala 101',
    observacoes: 'Primeiro bloco do modulo',
  },
  {
    id: 'modulo-2',
    cargaHorariaDiaria: 4,
    disciplinaId: 'disc-fso',
    diasSemana: [1, 2, 3, 4, 5],
    professorId: 'prof-luiza',
    dataInicio: '2026-04-27',
    dataFim: '2026-05-01',
    cargaHorariaSemanal: 20,
    sala: 'Sala 205',
    observacoes: 'Modulo compartilhado entre cursos',
  },
  {
    id: 'modulo-3',
    cargaHorariaDiaria: 4,
    disciplinaId: 'disc-ic',
    diasSemana: [1, 2, 3, 4, 5],
    professorId: 'prof-carla',
    dataInicio: '2026-05-18',
    dataFim: '2026-05-22',
    cargaHorariaSemanal: 20,
    sala: 'Laboratorio 2',
    observacoes: 'Bloco posterior ao evento institucional',
  },
];

export const fallbackIntercursos: Intercurso[] = [
  { cronogramaModuloId: 'modulo-1', cursoId: 'curso-gti' },
  { cronogramaModuloId: 'modulo-2', cursoId: 'curso-gti' },
  { cronogramaModuloId: 'modulo-2', cursoId: 'curso-gestao' },
  { cronogramaModuloId: 'modulo-3', cursoId: 'curso-contabilidade' },
];

export function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

export function getNextWeekRange(referenceDate = new Date()) {
  const baseDate = new Date(referenceDate);
  const day = baseDate.getDay();
  const distanceToNextMonday = ((8 - day) % 7) || 7;
  const startDate = addDays(baseDate, distanceToNextMonday);
  startDate.setHours(0, 0, 0, 0);

  const endDate = addDays(startDate, 4);
  endDate.setHours(23, 59, 59, 999);

  return {
    start: startDate,
    end: endDate,
  };
}

export function formatDateRange(startDate: string, endDate: string) {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  });

  return `${formatter.format(new Date(startDate))} - ${formatter.format(
    new Date(endDate)
  )}`;
}

export function rangesOverlap(
  leftStart: string,
  leftEnd: string,
  rightStart: string,
  rightEnd: string
) {
  const leftStartTime = new Date(leftStart).getTime();
  const leftEndTime = new Date(leftEnd).getTime();
  const rightStartTime = new Date(rightStart).getTime();
  const rightEndTime = new Date(rightEnd).getTime();

  return leftStartTime <= rightEndTime && rightStartTime <= leftEndTime;
}

export function isDateWithinRange(
  date: string,
  startDate: string,
  endDate: string
) {
  const target = new Date(date).getTime();
  return (
    target >= new Date(startDate).getTime() && target <= new Date(endDate).getTime()
  );
}

export function buildCronogramaCards(
  cursoId: string,
  cursos: Curso[],
  disciplinas: Disciplina[],
  professores: Professor[],
  modulos: CronogramaModulo[],
  intercursos: Intercurso[]
) {
  return modulos
    .filter((modulo) =>
      intercursos.some(
        (intercurso) =>
          intercurso.cronogramaModuloId === modulo.id && intercurso.cursoId === cursoId
      )
    )
    .map((modulo) => {
      const disciplina =
        disciplinas.find((item) => item.id === modulo.disciplinaId) ?? null;
      const professor =
        professores.find((item) => item.id === modulo.professorId) ?? null;
      const cursosParticipantes = intercursos
        .filter((item) => item.cronogramaModuloId === modulo.id)
        .map((item) => cursos.find((curso) => curso.id === item.cursoId) ?? null)
        .filter((curso): curso is Curso => Boolean(curso));

      return {
        id: modulo.id,
        cargaHorariaSemanal: modulo.cargaHorariaSemanal,
        cursos: cursosParticipantes,
        dataFim: modulo.dataFim,
        dataInicio: modulo.dataInicio,
        disciplinaNome: disciplina?.nome ?? 'Disciplina nao identificada',
        observacoes: modulo.observacoes,
        professorCidadeOrigem: professor?.cidadeOrigem ?? null,
        professorNome: professor?.nome ?? null,
        sala: modulo.sala,
      } satisfies CronogramaPublicoCard;
    })
    .sort(
      (left, right) =>
        new Date(left.dataInicio).getTime() - new Date(right.dataInicio).getTime()
    );
}

export function getDisciplinaScheduledHours(
  disciplinaId: string,
  modulos: CronogramaModulo[]
) {
  return modulos
    .filter((modulo) => modulo.disciplinaId === disciplinaId)
    .reduce((total, modulo) => total + modulo.cargaHorariaSemanal, 0);
}

export function getDisciplinaProgress(
  disciplina: Disciplina | null,
  modulos: CronogramaModulo[]
) {
  if (!disciplina || !disciplina.cargaHorariaTotal) {
    return null;
  }

  const total = disciplina.cargaHorariaTotal;
  const scheduled = getDisciplinaScheduledHours(disciplina.id, modulos);
  const remaining = Math.max(total - scheduled, 0);
  const percentual = total > 0 ? Math.min(Math.round((scheduled / total) * 100), 100) : 0;

  return {
    percentual,
    remaining,
    scheduled,
    total,
  };
}

export function getUpcomingModulesForCourse(
  cursoId: string,
  cursos: Curso[],
  disciplinas: Disciplina[],
  professores: Professor[],
  modulos: CronogramaModulo[],
  intercursos: Intercurso[],
  referenceDate = new Date()
) {
  const nextWeek = getNextWeekRange(referenceDate);

  return buildCronogramaCards(
    cursoId,
    cursos,
    disciplinas,
    professores,
    modulos,
    intercursos
  ).filter((item) =>
    rangesOverlap(
      item.dataInicio,
      item.dataFim,
      nextWeek.start.toISOString(),
      nextWeek.end.toISOString()
    )
  );
}

export function getCourseProgress(
  curso: Curso,
  modulos: CronogramaModulo[],
  intercursos: Intercurso[]
) {
  const totalAgendado = intercursos
    .filter((item) => item.cursoId === curso.id)
    .reduce((sum, item) => {
      const modulo = modulos.find((entry) => entry.id === item.cronogramaModuloId);
      return sum + (modulo?.cargaHorariaSemanal ?? 0);
    }, 0);

  const percentual = Math.min(
    100,
    Math.round((totalAgendado / curso.cargaHorariaTotal) * 100)
  );

  return {
    percentual,
    totalAgendado,
    totalCurso: curso.cargaHorariaTotal,
  };
}

export function getNextSuggestedModuleStartDate(
  modulos: CronogramaModulo[],
  eventos: EventoFeriado[],
  referenceDate = new Date()
) {
  const baseDate = getNextWeekRange(referenceDate).start;

  for (let weekOffset = 0; weekOffset < 52; weekOffset += 1) {
    const startDate = addDays(baseDate, weekOffset * 7);
    const endDate = addDays(startDate, 4);
    const isoStart = startDate.toISOString().slice(0, 10);
    const isoEnd = endDate.toISOString().slice(0, 10);

    const hasEventConflict = eventos.some((evento) =>
      isDateWithinRange(evento.data, isoStart, isoEnd)
    );
    const hasModuleConflict = modulos.some((modulo) =>
      rangesOverlap(modulo.dataInicio, modulo.dataFim, isoStart, isoEnd)
    );

    if (!hasEventConflict && !hasModuleConflict) {
      return isoStart;
    }
  }

  return baseDate.toISOString().slice(0, 10);
}
