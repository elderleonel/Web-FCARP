import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import {
  type CronogramaModulo,
  type Curso,
  type Disciplina,
  type DisciplinaCurso,
  type EventoFeriado,
  type Intercurso,
  type Professor,
} from '@/lib/unisched-data';

export type PlatformData = {
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
        'id, disciplina_id, professor_id, data_inicio, data_fim, carga_horaria_semanal, carga_horaria_diaria, dias_semana, sala, observacoes'
      )
      .order('data_inicio', { ascending: true }),
    supabase
      .from('intercursos')
      .select('cronograma_modulo_id, curso_id')
      .order('curso_id', { ascending: true }),
  ]);

  if (
    cursosResult.error ||
    professoresResult.error ||
    disciplinasResult.error ||
    disciplinaCursosResult.error ||
    eventosResult.error ||
    modulosResult.error ||
    intercursosResult.error
  ) {
    return {
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

  const hasMinimumData =
    cursosResult.data?.length &&
    professoresResult.data?.length &&
    disciplinasResult.data?.length;

  if (!hasMinimumData) {
    const disciplinaCursos = (disciplinaCursosResult.data ?? []).map((item) => ({
      cursoId: item.curso_id,
      disciplinaId: item.disciplina_id,
    }));

    return {
      cronogramaModulos: (modulosResult.data ?? []).map((item) => ({
        cargaHorariaDiaria: item.carga_horaria_diaria,
        id: item.id,
        cargaHorariaSemanal: item.carga_horaria_semanal,
        dataFim: item.data_fim,
        dataInicio: item.data_inicio,
        disciplinaId: item.disciplina_id,
        diasSemana: item.dias_semana ?? [],
        observacoes: item.observacoes,
        professorId: item.professor_id,
        sala: item.sala,
      })),
      cursos: (cursosResult.data ?? []).map((item) => ({
        cargaHorariaTotal: item.carga_horaria_total,
        corHex: item.cor_hex,
        id: item.id,
        nome: item.nome,
      })),
      disciplinas: (disciplinasResult.data ?? []).map((item) => ({
        cargaHorariaTotal: item.carga_horaria_total,
        courseIds: disciplinaCursos
          .filter((link) => link.disciplinaId === item.id)
          .map((link) => link.cursoId),
        id: item.id,
        isIntercurso: item.is_intercurso,
        nome: item.nome,
      })),
      disciplinaCursos,
      eventosFeriados: (eventosResult.data ?? []).map((item) => ({
        data: item.data,
        id: item.id,
        nome: item.nome,
        tipo: item.tipo,
      })),
      intercursos: (intercursosResult.data ?? []).map((item) => ({
        cronogramaModuloId: item.cronograma_modulo_id,
        cursoId: item.curso_id,
      })),
      message:
        'Supabase conectado. Cadastre cursos, professores e disciplinas para iniciar o uso do sistema.',
      professores: (professoresResult.data ?? []).map((item) => ({
        cidadeOrigem: item.cidade_origem,
        especialidade: item.especialidade,
        id: item.id,
        nome: item.nome,
      })),
      source: 'supabase',
    };
  }

  return {
    disciplinaCursos: (disciplinaCursosResult.data ?? []).map((item) => ({
      cursoId: item.curso_id,
      disciplinaId: item.disciplina_id,
    })),
    cronogramaModulos: (modulosResult.data ?? []).map((item) => ({
      cargaHorariaDiaria: item.carga_horaria_diaria,
      id: item.id,
      cargaHorariaSemanal: item.carga_horaria_semanal,
      dataFim: item.data_fim,
      dataInicio: item.data_inicio,
      disciplinaId: item.disciplina_id,
      diasSemana: item.dias_semana ?? [],
      observacoes: item.observacoes,
      professorId: item.professor_id,
      sala: item.sala,
    })),
    cursos: (cursosResult.data ?? []).map((item) => ({
      cargaHorariaTotal: item.carga_horaria_total,
      corHex: item.cor_hex,
      id: item.id,
      nome: item.nome,
    })),
    disciplinas: (disciplinasResult.data ?? []).map((item) => ({
      cargaHorariaTotal: item.carga_horaria_total,
      courseIds: (disciplinaCursosResult.data ?? [])
        .filter((link) => link.disciplina_id === item.id)
        .map((link) => link.curso_id),
      id: item.id,
      isIntercurso: item.is_intercurso,
      nome: item.nome,
    })),
    eventosFeriados: (eventosResult.data ?? []).map((item) => ({
      data: item.data,
      id: item.id,
      nome: item.nome,
      tipo: item.tipo,
    })),
    intercursos: (intercursosResult.data ?? []).map((item) => ({
      cronogramaModuloId: item.cronograma_modulo_id,
      cursoId: item.curso_id,
    })),
    message: 'FCARP DOC alimentado por dados reais do Supabase.',
    professores: (professoresResult.data ?? []).map((item) => ({
      cidadeOrigem: item.cidade_origem,
      especialidade: item.especialidade,
      id: item.id,
      nome: item.nome,
    })),
    source: 'supabase',
  };
}
