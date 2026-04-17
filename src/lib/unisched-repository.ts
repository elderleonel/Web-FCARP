import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import {
  fallbackCursos,
  fallbackDisciplinas,
  fallbackEventos,
  fallbackIntercursos,
  fallbackModulos,
  fallbackProfessores,
  type CronogramaModulo,
  type Curso,
  type Disciplina,
  type EventoFeriado,
  type Intercurso,
  type Professor,
} from '@/lib/unisched-data';

export type PlatformData = {
  cronogramaModulos: CronogramaModulo[];
  cursos: Curso[];
  disciplinas: Disciplina[];
  eventosFeriados: EventoFeriado[];
  intercursos: Intercurso[];
  message: string;
  professores: Professor[];
  source: 'mock' | 'supabase';
};

export async function loadPlatformData(): Promise<PlatformData> {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return {
      cronogramaModulos: fallbackModulos,
      cursos: fallbackCursos,
      disciplinas: fallbackDisciplinas,
      eventosFeriados: fallbackEventos,
      intercursos: fallbackIntercursos,
      message:
        'NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY ainda nao foram definidos.',
      professores: fallbackProfessores,
      source: 'mock',
    };
  }

  const [
    cursosResult,
    professoresResult,
    disciplinasResult,
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
      .select('id, nome')
      .order('nome', { ascending: true }),
    supabase
      .from('eventos_feriados')
      .select('id, nome, data, tipo')
      .order('data', { ascending: true }),
    supabase
      .from('cronograma_modulos')
      .select(
        'id, disciplina_id, professor_id, data_inicio, data_fim, carga_horaria_semanal, sala, observacoes'
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
    eventosResult.error ||
    modulosResult.error ||
    intercursosResult.error
  ) {
    return {
      cronogramaModulos: fallbackModulos,
      cursos: fallbackCursos,
      disciplinas: fallbackDisciplinas,
      eventosFeriados: fallbackEventos,
      intercursos: fallbackIntercursos,
      message:
        'Supabase conectado, mas as tabelas FCARP DOC ainda nao responderam. Mantive os dados de exemplo.',
      professores: fallbackProfessores,
      source: 'mock',
    };
  }

  const hasMinimumData =
    cursosResult.data?.length &&
    professoresResult.data?.length &&
    disciplinasResult.data?.length;

  if (!hasMinimumData) {
    return {
      cronogramaModulos: fallbackModulos,
      cursos: fallbackCursos,
      disciplinas: fallbackDisciplinas,
      eventosFeriados: fallbackEventos,
      intercursos: fallbackIntercursos,
      message:
        'Supabase conectado, mas o banco ainda nao tem dados suficientes para substituir o mock.',
      professores: fallbackProfessores,
      source: 'mock',
    };
  }

  return {
    cronogramaModulos: (modulosResult.data ?? []).map((item) => ({
      id: item.id,
      cargaHorariaSemanal: item.carga_horaria_semanal,
      dataFim: item.data_fim,
      dataInicio: item.data_inicio,
      disciplinaId: item.disciplina_id,
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
      id: item.id,
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
