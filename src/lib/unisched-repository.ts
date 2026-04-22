import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import {
  type CronogramaModulo,
  type Curso,
  type CursoSemestre,
  type Disciplina,
  type DisciplinaCurso,
  type EventoFeriado,
  type Intercurso,
  type Professor,
} from '@/lib/unisched-data';

export type PlatformData = {
  courseSemesters: CursoSemestre[];
  cronogramaModulos: CronogramaModulo[];
  cursos: Curso[];
  disciplinas: Disciplina[];
  disciplinaCursos: DisciplinaCurso[];
  eventosFeriados: EventoFeriado[];
  intercursos: Intercurso[];
  message: string;
  professores: Professor[];
  source: 'supabase';
};

export async function loadPlatformData(): Promise<PlatformData> {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return {
      courseSemesters: [],
      cronogramaModulos: [],
      cursos: [],
      disciplinas: [],
      disciplinaCursos: [],
      eventosFeriados: [],
      intercursos: [],
      message:
        'NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY ainda nao foram definidos.',
      professores: [],
      source: 'supabase',
    };
  }

  const [
    cursosResult,
    courseSemestersResult,
    professoresResult,
    disciplinasResult,
    disciplinaCursosResult,
    eventosResult,
    modulosResult,
    intercursosResult,
  ] = await Promise.all([
    supabase
      .from('cursos')
      .select('id, nome, carga_horaria_total, cor_hex')
      .order('nome', { ascending: true }),
    supabase
      .from('curso_semestres')
      .select('id, curso_id, numero, nome, ativo')
      .order('curso_id', { ascending: true })
      .order('numero', { ascending: true }),
    supabase
      .from('professores')
      .select('id, nome, cidade_origem, especialidade')
      .order('nome', { ascending: true }),
    supabase
      .from('disciplinas')
      .select('id, nome, carga_horaria_total, is_intercurso')
      .order('nome', { ascending: true }),
    supabase
      .from('disciplina_cursos')
      .select('disciplina_id, curso_id')
      .order('curso_id', { ascending: true }),
    supabase
      .from('eventos_feriados')
      .select('id, nome, data, tipo')
      .order('data', { ascending: true }),
    supabase
      .from('cronograma_modulos')
      .select(
        'id, disciplina_id, professor_id, data_inicio, data_fim, carga_horaria_semanal, carga_horaria_diaria, dias_semana, semestre, curso_semestre_id, sala, observacoes'
      )
      .order('data_inicio', { ascending: true }),
    supabase
      .from('intercursos')
      .select('cronograma_modulo_id, curso_id')
      .order('curso_id', { ascending: true }),
  ]);

  if (
    cursosResult.error ||
    courseSemestersResult.error ||
    professoresResult.error ||
    disciplinasResult.error ||
    disciplinaCursosResult.error ||
    eventosResult.error ||
    modulosResult.error ||
    intercursosResult.error
  ) {
    return {
      courseSemesters: [],
      cronogramaModulos: [],
      cursos: [],
      disciplinas: [],
      disciplinaCursos: [],
      eventosFeriados: [],
      intercursos: [],
      message:
        'Supabase conectado, mas ainda houve falha ao consultar as tabelas do calendario academico.',
      professores: [],
      source: 'supabase',
    };
  }

  const courseSemesters = (courseSemestersResult.data ?? []).map((item) => ({
    ativo: item.ativo,
    cursoId: item.curso_id,
    id: item.id,
    nome: item.nome,
    numero: item.numero,
  }));

  const mapModulo = (item: {
    carga_horaria_diaria: number | null;
    carga_horaria_semanal: number;
    curso_semestre_id: string | null;
    data_fim: string;
    data_inicio: string;
    dias_semana: number[] | null;
    disciplina_id: string;
    id: string;
    observacoes: string | null;
    professor_id: string | null;
    sala: string | null;
    semestre: number | null;
  }) => {
    const linkedSemester = courseSemesters.find(
      (courseSemester) => courseSemester.id === item.curso_semestre_id
    );

    return {
      cargaHorariaDiaria: item.carga_horaria_diaria,
      cargaHorariaSemanal: item.carga_horaria_semanal,
      cursoSemestreId: item.curso_semestre_id,
      dataFim: item.data_fim,
      dataInicio: item.data_inicio,
      diasSemana: item.dias_semana ?? [],
      disciplinaId: item.disciplina_id,
      id: item.id,
      observacoes: item.observacoes,
      professorId: item.professor_id,
      sala: item.sala,
      semestre: linkedSemester?.numero ?? item.semestre ?? null,
    } satisfies CronogramaModulo;
  };

  const disciplinaCursos = (disciplinaCursosResult.data ?? []).map((item) => ({
    cursoId: item.curso_id,
    disciplinaId: item.disciplina_id,
  }));

  const cursos = (cursosResult.data ?? []).map((item) => ({
    cargaHorariaTotal: item.carga_horaria_total,
    corHex: item.cor_hex,
    id: item.id,
    nome: item.nome,
  }));

  const professores = (professoresResult.data ?? []).map((item) => ({
    cidadeOrigem: item.cidade_origem,
    especialidade: item.especialidade,
    id: item.id,
    nome: item.nome,
  }));

  const disciplinas = (disciplinasResult.data ?? []).map((item) => ({
    cargaHorariaTotal: item.carga_horaria_total,
    courseIds: disciplinaCursos
      .filter((link) => link.disciplinaId === item.id)
      .map((link) => link.cursoId),
    id: item.id,
    isIntercurso: item.is_intercurso,
    nome: item.nome,
  }));

  const eventosFeriados = (eventosResult.data ?? []).map((item) => ({
    data: item.data,
    id: item.id,
    nome: item.nome,
    tipo: item.tipo,
  }));

  const intercursos = (intercursosResult.data ?? []).map((item) => ({
    cronogramaModuloId: item.cronograma_modulo_id,
    cursoId: item.curso_id,
  }));

  const cronogramaModulos = (modulosResult.data ?? []).map(mapModulo);

  const hasMinimumData =
    cursosResult.data?.length &&
    professoresResult.data?.length &&
    disciplinasResult.data?.length;

  if (!hasMinimumData) {
    return {
      courseSemesters,
      cronogramaModulos,
      cursos,
      disciplinas,
      disciplinaCursos,
      eventosFeriados,
      intercursos,
      message:
        'Supabase conectado. Cadastre cursos, semestres, professores e disciplinas para iniciar o uso do sistema.',
      professores,
      source: 'supabase',
    };
  }

  return {
    courseSemesters,
    cronogramaModulos,
    cursos,
    disciplinas,
    disciplinaCursos,
    eventosFeriados,
    intercursos,
    message: 'FCARP DOC alimentado por dados reais do Supabase.',
    professores,
    source: 'supabase',
  };
}
