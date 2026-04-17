'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Check,
  Edit3,
  GitBranch,
  GraduationCap,
  LogOut,
  Plus,
  Save,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import { loadPlatformData } from '@/lib/unisched-repository';
import {
  addDays,
  buildCronogramaCards,
  formatDateRange,
  getDisciplinaProgress,
  getNextSuggestedModuleStartDate,
  isDateWithinRange,
  rangesOverlap,
  type CronogramaModulo,
  type Curso,
  type Disciplina,
  type EventoFeriado,
  type Intercurso,
  type Professor,
} from '@/lib/unisched-data';

type AdminDashboardClientProps = {
  userEmail: string;
};

const WEEKDAY_OPTIONS = [
  { label: 'Seg', value: 1 },
  { label: 'Ter', value: 2 },
  { label: 'Qua', value: 3 },
  { label: 'Qui', value: 4 },
  { label: 'Sex', value: 5 },
] as const;

function getSelectedDaysCountInRange(
  startDate: string,
  endDate: string,
  diasSemana: number[]
) {
  if (!startDate || !endDate || !diasSemana.length) {
    return 0;
  }

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return 0;
  }

  const weekdays = new Set(diasSemana);
  const cursor = new Date(start);
  let total = 0;

  while (cursor <= end) {
    const jsDay = cursor.getDay();
    const isoDay = jsDay === 0 ? 7 : jsDay;

    if (weekdays.has(isoDay)) {
      total += 1;
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return total;
}

export function AdminDashboardClient({
  userEmail,
}: AdminDashboardClientProps) {
  const router = useRouter();
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [eventos, setEventos] = useState<EventoFeriado[]>([]);
  const [modulos, setModulos] = useState<CronogramaModulo[]>([]);
  const [intercursos, setIntercursos] = useState<Intercurso[]>([]);
  const [authMessage, setAuthMessage] = useState(`Sessao ativa para ${userEmail}.`);
  const [statusMessage, setStatusMessage] = useState(
    'Cadastre bases, bloqueie feriados e monte o cronograma modular com validacao de conflitos.'
  );
  const [loading, setLoading] = useState(true);
  const [submittingCurso, setSubmittingCurso] = useState(false);
  const [submittingProfessor, setSubmittingProfessor] = useState(false);
  const [submittingDisciplina, setSubmittingDisciplina] = useState(false);
  const [submittingEvento, setSubmittingEvento] = useState(false);
  const [submittingModulo, setSubmittingModulo] = useState(false);
  const [courseMessage, setCourseMessage] = useState('');
  const [professorMessage, setProfessorMessage] = useState('');
  const [disciplinaMessage, setDisciplinaMessage] = useState('');
  const [eventoMessage, setEventoMessage] = useState('');
  const [editingCursoId, setEditingCursoId] = useState<string | null>(null);
  const [editingProfessorId, setEditingProfessorId] = useState<string | null>(null);
  const [editingDisciplinaId, setEditingDisciplinaId] = useState<string | null>(null);
  const [editingEventoId, setEditingEventoId] = useState<string | null>(null);
  const [savingCursoId, setSavingCursoId] = useState<string | null>(null);
  const [savingProfessorId, setSavingProfessorId] = useState<string | null>(null);
  const [savingDisciplinaId, setSavingDisciplinaId] = useState<string | null>(null);
  const [savingEventoId, setSavingEventoId] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const [novoCursoNome, setNovoCursoNome] = useState('');
  const [novoCursoCarga, setNovoCursoCarga] = useState('360');
  const [novoCursoCor, setNovoCursoCor] = useState('#163B65');
  const [editCursoNome, setEditCursoNome] = useState('');
  const [editCursoCarga, setEditCursoCarga] = useState('360');
  const [editCursoCor, setEditCursoCor] = useState('#163B65');

  const [novoProfessorNome, setNovoProfessorNome] = useState('');
  const [novoProfessorCidade, setNovoProfessorCidade] = useState('');
  const [novoProfessorEspecialidade, setNovoProfessorEspecialidade] = useState('');
  const [editProfessorNome, setEditProfessorNome] = useState('');
  const [editProfessorCidade, setEditProfessorCidade] = useState('');
  const [editProfessorEspecialidade, setEditProfessorEspecialidade] = useState('');

  const [novaDisciplinaNome, setNovaDisciplinaNome] = useState('');
  const [novaDisciplinaCarga, setNovaDisciplinaCarga] = useState('72');
  const [novaDisciplinaIntercurso, setNovaDisciplinaIntercurso] = useState(false);
  const [novaDisciplinaCourseIds, setNovaDisciplinaCourseIds] = useState<string[]>([]);
  const [editDisciplinaNome, setEditDisciplinaNome] = useState('');
  const [editDisciplinaCarga, setEditDisciplinaCarga] = useState('72');
  const [editDisciplinaIntercurso, setEditDisciplinaIntercurso] = useState(false);
  const [editDisciplinaCourseIds, setEditDisciplinaCourseIds] = useState<string[]>([]);

  const [novoEventoNome, setNovoEventoNome] = useState('');
  const [novoEventoData, setNovoEventoData] = useState('');
  const [novoEventoTipo, setNovoEventoTipo] = useState<'feriado' | 'evento'>(
    'evento'
  );
  const [editEventoNome, setEditEventoNome] = useState('');
  const [editEventoData, setEditEventoData] = useState('');
  const [editEventoTipo, setEditEventoTipo] = useState<'feriado' | 'evento'>('evento');

  const [cursoBaseId, setCursoBaseId] = useState('');
  const [disciplinaId, setDisciplinaId] = useState('');
  const [professorId, setProfessorId] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [cargaHorariaDiaria, setCargaHorariaDiaria] = useState('4');
  const [sala, setSala] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [selectedWeekDays, setSelectedWeekDays] = useState<number[]>([1, 2, 3, 4, 5]);

  const cronogramaCards = useMemo(
    () =>
      cursos.flatMap((curso) =>
        buildCronogramaCards(
          curso.id,
          cursos,
          disciplinas,
          professores,
          modulos,
          intercursos
        ).slice(0, 3)
      ),
    [cursos, disciplinas, professores, modulos, intercursos]
  );

  const disciplinaProgressCards = useMemo(
    () =>
      disciplinas
        .map((disciplina) => ({
          disciplina,
          progress: getDisciplinaProgress(disciplina, modulos),
        }))
        .filter(
          (
            item
          ): item is {
            disciplina: Disciplina;
            progress: NonNullable<ReturnType<typeof getDisciplinaProgress>>;
          } => Boolean(item.progress)
        )
        .sort((left, right) => left.disciplina.nome.localeCompare(right.disciplina.nome, 'pt-BR')),
    [disciplinas, modulos]
  );

  const disciplinasDisponiveis = useMemo(() => {
    if (!cursoBaseId) {
      return disciplinas;
    }

    return disciplinas.filter((disciplina) => disciplina.courseIds.includes(cursoBaseId));
  }, [cursoBaseId, disciplinas]);

  const disciplinaIdEfetiva = disciplinasDisponiveis.some((item) => item.id === disciplinaId)
    ? disciplinaId
    : (disciplinasDisponiveis[0]?.id ?? '');

  const selectedDisciplina = useMemo(
    () => disciplinas.find((item) => item.id === disciplinaIdEfetiva) ?? null,
    [disciplinaIdEfetiva, disciplinas]
  );

  const cursosPermitidosDaDisciplina = useMemo(() => {
    if (!selectedDisciplina) {
      return [];
    }

    return cursos.filter((curso) => selectedDisciplina.courseIds.includes(curso.id));
  }, [cursos, selectedDisciplina]);

  const selectedDailyHours = Number(cargaHorariaDiaria) || 0;
  const selectedDaysCount = getSelectedDaysCountInRange(
    dataInicio,
    dataFim,
    selectedWeekDays
  );
  const previewWeeklyHours = selectedDaysCount * selectedDailyHours;
  const disciplinaProgress = useMemo(
    () => getDisciplinaProgress(selectedDisciplina, modulos),
    [selectedDisciplina, modulos]
  );
  const previewRemainingHours = disciplinaProgress
    ? Math.max(disciplinaProgress.total - disciplinaProgress.scheduled - previewWeeklyHours, 0)
    : null;

  useEffect(() => {
    let isMounted = true;

    async function bootstrapDashboard() {
      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        if (!isMounted) {
          return;
        }

        setLoading(false);
        setAuthMessage(
          'Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para habilitar o admin.'
        );
        return;
      }

      const [{ data: userResult, error: userError }, platformData] = await Promise.all([
        supabase.auth.getUser(),
        loadPlatformData(),
      ]);

      if (!isMounted) {
        return;
      }

      if (userError || !userResult.user) {
        router.replace('/admin/login');
        return;
      }

      setAuthMessage(`Sessao ativa para ${userResult.user.email ?? userEmail}.`);
      setCursos(platformData.cursos);
      setProfessores(platformData.professores);
      setDisciplinas(platformData.disciplinas);
      setEventos(platformData.eventosFeriados);
      setModulos(platformData.cronogramaModulos);
      setIntercursos(platformData.intercursos);
      setStatusMessage(platformData.message);

      if (!cursoBaseId && platformData.cursos.length > 0) {
        setCursoBaseId(platformData.cursos[0].id);
      }

      if (!selectedCourseIds.length && platformData.cursos.length > 0) {
        setSelectedCourseIds([platformData.cursos[0].id]);
      }

      const cursoInicial = cursoBaseId || platformData.cursos[0]?.id || '';
      const disciplinasDoCursoInicial = cursoInicial
        ? platformData.disciplinas.filter((item) => item.courseIds.includes(cursoInicial))
        : platformData.disciplinas;

      if (!disciplinaId && disciplinasDoCursoInicial.length > 0) {
        setDisciplinaId(disciplinasDoCursoInicial[0].id);
      }

      if (!professorId && platformData.professores.length > 0) {
        setProfessorId(platformData.professores[0].id);
      }

      if (!dataInicio && platformData.cursos.length > 0) {
        setDataInicio(
          getNextSuggestedModuleStartDate(
            platformData.cronogramaModulos,
            platformData.eventosFeriados
          )
        );
      }

      setLoading(false);
    }

    void bootstrapDashboard();

    return () => {
      isMounted = false;
    };
  }, [router, userEmail, dataInicio, disciplinaId, professorId, selectedCourseIds.length, cursoBaseId]);

  async function reloadPlatformData() {
    const platformData = await loadPlatformData();
    setCursos(platformData.cursos);
    setProfessores(platformData.professores);
    setDisciplinas(platformData.disciplinas);
    setEventos(platformData.eventosFeriados);
    setModulos(platformData.cronogramaModulos);
    setIntercursos(platformData.intercursos);
    setStatusMessage(platformData.message);
  }

  function formatRequestMessage(message: string) {
    if (message.toLowerCase().includes('duplicate key')) {
      return 'Ja existe um registro com esses dados. Revise o cadastro e tente novamente.';
    }

    return message;
  }

  function resetEditingStates() {
    setEditingCursoId(null);
    setEditingProfessorId(null);
    setEditingDisciplinaId(null);
    setEditingEventoId(null);
  }

  function startCursoEdit(curso: Curso) {
    resetEditingStates();
    setEditingCursoId(curso.id);
    setEditCursoNome(curso.nome);
    setEditCursoCarga(String(curso.cargaHorariaTotal));
    setEditCursoCor(curso.corHex ?? '#163B65');
    setCourseMessage('');
  }

  function startProfessorEdit(professor: Professor) {
    resetEditingStates();
    setEditingProfessorId(professor.id);
    setEditProfessorNome(professor.nome);
    setEditProfessorCidade(professor.cidadeOrigem ?? '');
    setEditProfessorEspecialidade(professor.especialidade ?? '');
    setProfessorMessage('');
  }

  function startDisciplinaEdit(disciplina: Disciplina) {
    resetEditingStates();
    setEditingDisciplinaId(disciplina.id);
    setEditDisciplinaNome(disciplina.nome);
    setEditDisciplinaCarga(
      disciplina.cargaHorariaTotal ? String(disciplina.cargaHorariaTotal) : '72'
    );
    setEditDisciplinaIntercurso(disciplina.isIntercurso);
    setEditDisciplinaCourseIds(disciplina.courseIds);
    setDisciplinaMessage('');
  }

  function startEventoEdit(evento: EventoFeriado) {
    resetEditingStates();
    setEditingEventoId(evento.id);
    setEditEventoNome(evento.nome);
    setEditEventoData(evento.data);
    setEditEventoTipo(evento.tipo);
    setEventoMessage('');
  }

  async function handleUpdateCurso(cursoId: string) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    if (!editCursoNome.trim()) {
      setCourseMessage('Informe o nome do curso.');
      return;
    }

    if (Number(editCursoCarga) <= 0) {
      setCourseMessage('Informe uma carga horaria total valida.');
      return;
    }

    setSavingCursoId(cursoId);
    setCourseMessage('Atualizando curso...');

    const { error } = await supabase
      .from('cursos')
      .update({
        nome: editCursoNome.trim(),
        carga_horaria_total: Number(editCursoCarga),
        cor_hex: editCursoCor || null,
      })
      .eq('id', cursoId);

    if (error) {
      setSavingCursoId(null);
      setCourseMessage(formatRequestMessage(error.message));
      return;
    }

    await reloadPlatformData();
    setSavingCursoId(null);
    setEditingCursoId(null);
    setCourseMessage('Curso atualizado com sucesso.');
    setStatusMessage('Curso atualizado com sucesso.');
  }

  async function handleUpdateProfessor(professorIdToUpdate: string) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    if (!editProfessorNome.trim()) {
      setProfessorMessage('Informe o nome do professor.');
      return;
    }

    setSavingProfessorId(professorIdToUpdate);
    setProfessorMessage('Atualizando professor...');

    const { error } = await supabase
      .from('professores')
      .update({
        nome: editProfessorNome.trim(),
        cidade_origem: editProfessorCidade || null,
        especialidade: editProfessorEspecialidade || null,
      })
      .eq('id', professorIdToUpdate);

    if (error) {
      setSavingProfessorId(null);
      setProfessorMessage(formatRequestMessage(error.message));
      return;
    }

    await reloadPlatformData();
    setSavingProfessorId(null);
    setEditingProfessorId(null);
    setProfessorMessage('Professor atualizado com sucesso.');
    setStatusMessage('Professor atualizado com sucesso.');
  }

  async function handleUpdateDisciplina(disciplinaIdToUpdate: string) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    if (!editDisciplinaNome.trim()) {
      setDisciplinaMessage('Informe o nome da disciplina.');
      return;
    }

    if (Number(editDisciplinaCarga) <= 0) {
      setDisciplinaMessage('Informe a carga horaria semestral da disciplina.');
      return;
    }

    if (!editDisciplinaCourseIds.length) {
      setDisciplinaMessage('Vincule a disciplina a pelo menos um curso.');
      return;
    }

    if (!editDisciplinaIntercurso && editDisciplinaCourseIds.length > 1) {
      setDisciplinaMessage('Disciplina regular deve ficar vinculada a apenas um curso.');
      return;
    }

    if (editDisciplinaIntercurso && editDisciplinaCourseIds.length < 2) {
      setDisciplinaMessage('Disciplina intercurso precisa estar vinculada a pelo menos dois cursos.');
      return;
    }

    setSavingDisciplinaId(disciplinaIdToUpdate);
    setDisciplinaMessage('Atualizando disciplina...');

    const { error } = await supabase
      .from('disciplinas')
      .update({
        carga_horaria_total: Number(editDisciplinaCarga),
        is_intercurso: editDisciplinaIntercurso,
        nome: editDisciplinaNome.trim(),
      })
      .eq('id', disciplinaIdToUpdate);

    if (error) {
      setSavingDisciplinaId(null);
      setDisciplinaMessage(formatRequestMessage(error.message));
      return;
    }

    const { error: deleteLinksError } = await supabase
      .from('disciplina_cursos')
      .delete()
      .eq('disciplina_id', disciplinaIdToUpdate);

    if (deleteLinksError) {
      setSavingDisciplinaId(null);
      setDisciplinaMessage(formatRequestMessage(deleteLinksError.message));
      return;
    }

    const { error: insertLinksError } = await supabase.from('disciplina_cursos').insert(
      editDisciplinaCourseIds.map((cursoId) => ({
        curso_id: cursoId,
        disciplina_id: disciplinaIdToUpdate,
      }))
    );

    if (insertLinksError) {
      setSavingDisciplinaId(null);
      setDisciplinaMessage(formatRequestMessage(insertLinksError.message));
      return;
    }

    await reloadPlatformData();
    setSavingDisciplinaId(null);
    setEditingDisciplinaId(null);
    setDisciplinaMessage('Disciplina atualizada com sucesso.');
    setStatusMessage('Disciplina atualizada com sucesso.');
  }

  async function handleUpdateEvento(eventoIdToUpdate: string) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    if (!editEventoNome.trim()) {
      setEventoMessage('Informe o nome do evento ou feriado.');
      return;
    }

    if (!editEventoData) {
      setEventoMessage('Informe a data do registro.');
      return;
    }

    setSavingEventoId(eventoIdToUpdate);
    setEventoMessage('Atualizando evento...');

    const { error } = await supabase
      .from('eventos_feriados')
      .update({
        nome: editEventoNome.trim(),
        data: editEventoData,
        tipo: editEventoTipo,
      })
      .eq('id', eventoIdToUpdate);

    if (error) {
      setSavingEventoId(null);
      setEventoMessage(formatRequestMessage(error.message));
      return;
    }

    await reloadPlatformData();
    setSavingEventoId(null);
    setEditingEventoId(null);
    setEventoMessage('Evento ou feriado atualizado com sucesso.');
    setStatusMessage('Evento ou feriado atualizado com sucesso.');
  }

  async function handleDeleteRegistro(
    table:
      | 'cursos'
      | 'professores'
      | 'disciplinas'
      | 'eventos_feriados',
    id: string,
    messagePrefix: string
  ) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    const confirmed = window.confirm(`Deseja excluir este ${messagePrefix.toLowerCase()}?`);

    if (!confirmed) {
      return;
    }

    setDeletingKey(`${table}:${id}`);
    const { error } = await supabase.from(table).delete().eq('id', id);

    if (error) {
      setDeletingKey(null);
      const formattedMessage = formatRequestMessage(error.message);
      if (table === 'cursos') setCourseMessage(formattedMessage);
      if (table === 'professores') setProfessorMessage(formattedMessage);
      if (table === 'disciplinas') setDisciplinaMessage(formattedMessage);
      if (table === 'eventos_feriados') setEventoMessage(formattedMessage);
      return;
    }

    await reloadPlatformData();
    setDeletingKey(null);
    resetEditingStates();
    setStatusMessage(`${messagePrefix} excluido com sucesso.`);
    if (table === 'cursos') setCourseMessage(`${messagePrefix} excluido com sucesso.`);
    if (table === 'professores') setProfessorMessage(`${messagePrefix} excluido com sucesso.`);
    if (table === 'disciplinas') setDisciplinaMessage(`${messagePrefix} excluido com sucesso.`);
    if (table === 'eventos_feriados') setEventoMessage(`${messagePrefix} excluido com sucesso.`);
  }

  async function handleCreateCurso(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    if (!novoCursoNome.trim()) {
      setCourseMessage('Informe o nome do curso.');
      return;
    }

    if (Number(novoCursoCarga) <= 0) {
      setCourseMessage('Informe uma carga horaria total valida.');
      return;
    }

    setSubmittingCurso(true);
    setCourseMessage('Salvando curso...');
    const { error } = await supabase.from('cursos').insert({
      nome: novoCursoNome.trim(),
      carga_horaria_total: Number(novoCursoCarga),
      cor_hex: novoCursoCor || null,
    });

    if (error) {
      setSubmittingCurso(false);
      setCourseMessage(formatRequestMessage(error.message));
      return;
    }

    setNovoCursoNome('');
    setNovoCursoCarga('360');
    setNovoCursoCor('#163B65');
    await reloadPlatformData();
    setSubmittingCurso(false);
    setCourseMessage('Curso cadastrado com sucesso.');
    setStatusMessage('Curso cadastrado com sucesso.');
  }

  async function handleCreateProfessor(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    if (!novoProfessorNome.trim()) {
      setProfessorMessage('Informe o nome do professor.');
      return;
    }

    setSubmittingProfessor(true);
    setProfessorMessage('Salvando professor...');
    const { error } = await supabase.from('professores').insert({
      nome: novoProfessorNome.trim(),
      cidade_origem: novoProfessorCidade || null,
      especialidade: novoProfessorEspecialidade || null,
    });

    if (error) {
      setSubmittingProfessor(false);
      setProfessorMessage(formatRequestMessage(error.message));
      return;
    }

    setNovoProfessorNome('');
    setNovoProfessorCidade('');
    setNovoProfessorEspecialidade('');
    await reloadPlatformData();
    setSubmittingProfessor(false);
    setProfessorMessage('Professor cadastrado com sucesso.');
    setStatusMessage('Professor cadastrado com sucesso.');
  }

  async function handleCreateDisciplina(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    if (!novaDisciplinaNome.trim()) {
      setDisciplinaMessage('Informe o nome da disciplina.');
      return;
    }

    if (Number(novaDisciplinaCarga) <= 0) {
      setDisciplinaMessage('Informe a carga horaria semestral da disciplina.');
      return;
    }

    if (!novaDisciplinaCourseIds.length) {
      setDisciplinaMessage('Selecione pelo menos um curso para a disciplina.');
      return;
    }

    if (!novaDisciplinaIntercurso && novaDisciplinaCourseIds.length > 1) {
      setDisciplinaMessage('Disciplina regular deve ficar vinculada a apenas um curso.');
      return;
    }

    if (novaDisciplinaIntercurso && novaDisciplinaCourseIds.length < 2) {
      setDisciplinaMessage('Disciplina intercurso precisa estar vinculada a pelo menos dois cursos.');
      return;
    }

    setSubmittingDisciplina(true);
    setDisciplinaMessage('Salvando disciplina...');
    const { data: disciplinaInserida, error } = await supabase
      .from('disciplinas')
      .insert({
        carga_horaria_total: Number(novaDisciplinaCarga),
        is_intercurso: novaDisciplinaIntercurso,
        nome: novaDisciplinaNome.trim(),
      })
      .select('id')
      .single();

    if (error || !disciplinaInserida) {
      setSubmittingDisciplina(false);
      setDisciplinaMessage(formatRequestMessage(error?.message ?? 'Nao foi possivel salvar a disciplina.'));
      return;
    }

    const { error: linksError } = await supabase.from('disciplina_cursos').insert(
      novaDisciplinaCourseIds.map((cursoId) => ({
        curso_id: cursoId,
        disciplina_id: disciplinaInserida.id,
      }))
    );

    if (linksError) {
      setSubmittingDisciplina(false);
      setDisciplinaMessage(formatRequestMessage(linksError.message));
      return;
    }

    setNovaDisciplinaNome('');
    setNovaDisciplinaCarga('72');
    setNovaDisciplinaIntercurso(false);
    setNovaDisciplinaCourseIds([]);
    await reloadPlatformData();
    setSubmittingDisciplina(false);
    setDisciplinaMessage('Disciplina cadastrada com sucesso.');
    setStatusMessage('Disciplina cadastrada com sucesso.');
  }

  async function handleCreateEvento(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    if (!novoEventoNome.trim()) {
      setEventoMessage('Informe o nome do evento ou feriado.');
      return;
    }

    if (!novoEventoData) {
      setEventoMessage('Informe a data do registro.');
      return;
    }

    setSubmittingEvento(true);
    setEventoMessage('Salvando evento...');
    const { error } = await supabase.from('eventos_feriados').insert({
      nome: novoEventoNome.trim(),
      data: novoEventoData,
      tipo: novoEventoTipo,
    });

    if (error) {
      setSubmittingEvento(false);
      setEventoMessage(formatRequestMessage(error.message));
      return;
    }

    setNovoEventoNome('');
    setNovoEventoData('');
    setNovoEventoTipo('evento');
    await reloadPlatformData();
    setSubmittingEvento(false);
    setEventoMessage('Evento ou feriado cadastrado com sucesso.');
    setStatusMessage('Evento ou feriado cadastrado com sucesso.');
  }

  async function handleCreateModulo(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    if (!cursoBaseId) {
      setStatusMessage('Selecione o curso base antes de montar o calendario.');
      return;
    }

    if (!selectedDisciplina) {
      setStatusMessage('Selecione uma disciplina valida para montar a semana.');
      return;
    }

    if (!selectedDisciplina.courseIds.includes(cursoBaseId)) {
      setStatusMessage('A disciplina selecionada nao pertence ao curso base escolhido.');
      return;
    }

    const courseIdsToSchedule = selectedDisciplina.isIntercurso
      ? selectedCourseIds.filter((cursoId) => selectedDisciplina.courseIds.includes(cursoId))
      : [cursoBaseId];

    if (!courseIdsToSchedule.length) {
      setStatusMessage('Selecione pelo menos um curso participante.');
      return;
    }

    if (!selectedDisciplina.cargaHorariaTotal) {
      setStatusMessage(
        'Defina a carga horaria semestral da disciplina antes de criar aulas semanais.'
      );
      return;
    }

    if (!selectedWeekDays.length) {
      setStatusMessage('Selecione pelo menos um dia letivo na semana.');
      return;
    }

    if (selectedDailyHours <= 0 || selectedDailyHours > 4) {
      setStatusMessage('A carga diaria deve ficar entre 1h e 4h por dia.');
      return;
    }

    if (!dataFim) {
      setStatusMessage('Informe a data final da etapa da disciplina.');
      return;
    }

    if (previewWeeklyHours <= 0) {
      setStatusMessage(
        'A carga calculada precisa ser maior que zero. Revise o intervalo e os dias selecionados.'
      );
      return;
    }

    if (
      disciplinaProgress &&
      disciplinaProgress.scheduled + previewWeeklyHours > disciplinaProgress.total
    ) {
      setStatusMessage(
        `A disciplina ${selectedDisciplina.nome} ultrapassa a carga prevista. Restam ${disciplinaProgress.remaining}h para agendar.`
      );
      return;
    }

    const inicio = new Date(`${dataInicio}T00:00:00`);
    const fim = new Date(`${dataFim}T00:00:00`);

    if (Number.isNaN(fim.getTime()) || fim < inicio) {
      setStatusMessage('A data final deve ser igual ou posterior a data inicial.');
      return;
    }

    const eventConflict = eventos.find((evento) =>
      isDateWithinRange(evento.data, dataInicio, dataFim)
    );

    if (eventConflict) {
      setStatusMessage(
        `Conflito detectado: ${eventConflict.nome} bloqueia a semana ${formatDateRange(
          dataInicio,
          dataFim
        )}.`
      );
      return;
    }

    const professorConflict = modulos.find(
      (modulo) =>
        modulo.professorId === professorId &&
        rangesOverlap(modulo.dataInicio, modulo.dataFim, dataInicio, dataFim)
    );

    if (professorConflict) {
      setStatusMessage(
        'O professor selecionado ja possui um modulo cadastrado nessa semana.'
      );
      return;
    }

    const relatedModuloIds = new Set(
      intercursos
        .filter((item) => courseIdsToSchedule.includes(item.cursoId))
        .map((item) => item.cronogramaModuloId)
    );

    const courseConflict = modulos.find(
      (modulo) =>
        relatedModuloIds.has(modulo.id) &&
        rangesOverlap(modulo.dataInicio, modulo.dataFim, dataInicio, dataFim)
    );

    if (courseConflict) {
      setStatusMessage(
        'Um dos cursos participantes ja tem aula cadastrada nessa semana. Escolha outra data.'
      );
      return;
    }

    setSubmittingModulo(true);

    const { data: moduloInserido, error: moduloError } = await supabase
      .from('cronograma_modulos')
      .insert({
        carga_horaria_diaria: selectedDailyHours,
        carga_horaria_semanal: previewWeeklyHours,
        dias_semana: selectedWeekDays,
        disciplina_id: disciplinaIdEfetiva,
        professor_id: professorId || null,
        data_inicio: dataInicio,
        data_fim: dataFim,
        sala: sala || null,
        observacoes: observacoes || null,
      })
      .select('id')
      .single();

    if (moduloError || !moduloInserido) {
      setSubmittingModulo(false);
      setStatusMessage(moduloError?.message ?? 'Nao foi possivel criar o modulo.');
      return;
    }

    const { error: intercursoError } = await supabase.from('intercursos').insert(
      courseIdsToSchedule.map((cursoId) => ({
        cronograma_modulo_id: moduloInserido.id,
        curso_id: cursoId,
      }))
    );

    if (intercursoError) {
      setSubmittingModulo(false);
      setStatusMessage(intercursoError.message);
      return;
    }

    setDataInicio(getNextSuggestedModuleStartDate(modulos, eventos, addDays(inicio, 7)));
    setDataFim('');
    setCargaHorariaDiaria('4');
    setSelectedWeekDays([1, 2, 3, 4, 5]);
    setSelectedCourseIds(cursoBaseId ? [cursoBaseId] : []);
    setSala('');
    setObservacoes('');
    await reloadPlatformData();
    setSubmittingModulo(false);
    setStatusMessage(
      `Etapa criada para ${selectedDisciplina.nome} com ${previewWeeklyHours}h previstas e vinculada aos cursos selecionados.`
    );
  }

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient();

    if (supabase) {
      await supabase.auth.signOut();
    }

    router.push('/admin/login');
    router.refresh();
  }

  function toggleCourse(cursoId: string) {
    setSelectedCourseIds((current) =>
      current.includes(cursoId)
        ? current.filter((item) => item !== cursoId)
        : [...current, cursoId]
    );
  }

  function toggleDisciplinaCourseSelection(
    cursoId: string,
    mode: 'create' | 'edit'
  ) {
    const setter = mode === 'create' ? setNovaDisciplinaCourseIds : setEditDisciplinaCourseIds;

    setter((current) =>
      current.includes(cursoId)
        ? current.filter((item) => item !== cursoId)
        : [...current, cursoId].sort((left, right) => left.localeCompare(right))
    );
  }

  function handleCursoBaseChange(value: string) {
    setCursoBaseId(value);
    setSelectedCourseIds(value ? [value] : []);
    const proximasDisciplinas = value
      ? disciplinas.filter((disciplina) => disciplina.courseIds.includes(value))
      : disciplinas;
    setDisciplinaId(proximasDisciplinas[0]?.id ?? '');
  }

  function handleDisciplinaChange(value: string) {
    setDisciplinaId(value);

    const disciplinaSelecionada =
      disciplinas.find((disciplina) => disciplina.id === value) ?? null;

    if (!disciplinaSelecionada || !cursoBaseId) {
      return;
    }

    if (!disciplinaSelecionada.isIntercurso) {
      setSelectedCourseIds([cursoBaseId]);
      return;
    }

    const nextCourseIds = disciplinaSelecionada.courseIds.includes(cursoBaseId)
      ? [cursoBaseId]
      : [];
    setSelectedCourseIds(nextCourseIds);
  }

  function toggleWeekDay(day: number) {
    setSelectedWeekDays((current) =>
      current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day].sort((left, right) => left - right)
    );
  }

  function handleDataInicioChange(value: string) {
    setDataInicio(value);

    if (!value) {
      setDataFim('');
      return;
    }

    const suggestedEnd = addDays(new Date(`${value}T00:00:00`), 4)
      .toISOString()
      .slice(0, 10);

    if (!dataFim || new Date(`${dataFim}T00:00:00`) < new Date(`${value}T00:00:00`)) {
      setDataFim(suggestedEnd);
    }
  }

  return (
    <main className="min-h-screen bg-[#eef2f6] px-4 py-6 text-[#171717] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-[32px] border border-white/70 bg-[#fcfcfd] p-5 shadow-[0_30px_90px_rgba(132,146,166,0.18)] sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[#5b61ff]">FCARP DOC</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[#121216]">
              Gestao de calendario modular
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#666672]">{authMessage}</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-[#e9e9ef] bg-white px-4 py-2.5 text-sm font-medium text-[#171717]"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full bg-[#121216] px-4 py-2.5 text-sm font-medium text-white"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-[#ececf1] bg-white px-4 py-3 text-sm text-[#5d5d66]">
          {statusMessage}
        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <section className="rounded-[28px] border border-[#ececf1] bg-[#f7f7fa] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef0ff] text-[#5b61ff]">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#16161a]">
                    Construtor de cronograma
                  </h2>
                  <p className="text-sm text-[#6b6b74]">
                    Crie modulos semanais com validacao de feriados, eventos e conflitos de professor.
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateModulo} className="mt-5 grid gap-4 md:grid-cols-2">
                <AdminSelect
                  label="Curso base"
                  value={cursoBaseId}
                  onChange={handleCursoBaseChange}
                  options={cursos.map((item) => ({ label: item.nome, value: item.id }))}
                />
                <AdminSelect
                  label="Disciplina"
                  value={disciplinaIdEfetiva}
                  onChange={handleDisciplinaChange}
                  options={disciplinasDisponiveis.map((item) => ({
                    label: item.isIntercurso ? `${item.nome} · Intercurso` : item.nome,
                    value: item.id,
                  }))}
                />
                <AdminSelect
                  label="Professor"
                  value={professorId}
                  onChange={setProfessorId}
                  options={professores.map((item) => ({ label: item.nome, value: item.id }))}
                />
                <AdminInput
                  label="Data de inicio"
                  value={dataInicio}
                  onChange={handleDataInicioChange}
                  type="date"
                  placeholder=""
                />
                <AdminInput
                  label="Carga diaria por aula"
                  value={cargaHorariaDiaria}
                  onChange={setCargaHorariaDiaria}
                  type="number"
                  placeholder="4"
                />
                <AdminInput
                  label="Sala"
                  value={sala}
                  onChange={setSala}
                  placeholder="Sala 204"
                />
                <AdminInput
                  label="Data final"
                  value={dataFim}
                  onChange={setDataFim}
                  type="date"
                  placeholder=""
                />
                <div className="md:col-span-2">
                  <p className="mb-2 text-sm font-medium text-[#4f4f59]">Dias com aula na semana</p>
                  <div className="grid gap-3 sm:grid-cols-5">
                    {WEEKDAY_OPTIONS.map((day) => {
                      const checked = selectedWeekDays.includes(day.value);

                      return (
                        <label
                          key={day.value}
                          className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition ${
                            checked
                              ? 'border-[#163b65] bg-[#edf4fb] text-[#163b65]'
                              : 'border-[#e5e5ec] bg-white text-[#4f4f59]'
                          }`}
                        >
                          <span className="font-medium">{day.label}</span>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleWeekDay(day.value)}
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div className="md:col-span-2 rounded-[24px] border border-[#dbe4ee] bg-[#f9fbfd] p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#163b65]">Acompanhamento da disciplina</p>
                      <p className="mt-1 text-sm text-[#5d6671]">
                        A carga do curso continua independente. Aqui o controle considera apenas a disciplina selecionada ao longo do semestre.
                      </p>
                    </div>
                    <div className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#163b65]">
                      {previewWeeklyHours}h previstas no periodo
                    </div>
                  </div>
                  {selectedDisciplina ? (
                    <div className="mt-4 space-y-3">
                      <div className="flex flex-wrap items-center gap-3 text-sm text-[#1d2430]">
                        <span className="font-medium">{selectedDisciplina.nome}</span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs text-[#5d6671]">
                          Carga da disciplina:{' '}
                          {selectedDisciplina.cargaHorariaTotal
                            ? `${selectedDisciplina.cargaHorariaTotal}h`
                            : 'nao definida'}
                        </span>
                      </div>
                      {disciplinaProgress ? (
                        <>
                          <div className="grid gap-3 md:grid-cols-4">
                            <MetricPill label="Ja agendado" value={`${disciplinaProgress.scheduled}h`} />
                            <MetricPill label="Restante atual" value={`${disciplinaProgress.remaining}h`} />
                            <MetricPill label="Novo periodo" value={`${previewWeeklyHours}h`} />
                            <MetricPill
                              label="Saldo apos salvar"
                              value={`${previewRemainingHours ?? 0}h`}
                              emphasis={previewRemainingHours === 0}
                            />
                          </div>
                          <div className="grid gap-3 md:grid-cols-3">
                            <MetricPill label="Dias letivos no intervalo" value={String(selectedDaysCount)} />
                            <MetricPill label="Carga diaria" value={`${selectedDailyHours || 0}h`} />
                            <MetricPill label="Intervalo" value={dataInicio && dataFim ? formatDateRange(dataInicio, dataFim) : '--'} />
                          </div>
                          <div className="space-y-2">
                            <div className="h-2 rounded-full bg-[#e8edf2]">
                              <div
                                className="h-2 rounded-full bg-[linear-gradient(90deg,#163B65,#2C6E91)]"
                                style={{
                                  width: `${Math.min(
                                    Math.round(
                                      ((disciplinaProgress.scheduled + previewWeeklyHours) /
                                        disciplinaProgress.total) *
                                        100
                                    ),
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                            <p className="text-xs text-[#6b7280]">
                              Cada dia marcado dentro do intervalo consome ate 4h. Exemplo: segunda a quarta com 4h por dia resultam em 12h abatidas da carga da disciplina.
                            </p>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-[#8b5e00]">
                          Defina a carga horaria da disciplina para liberar o acompanhamento dinamico e o bloqueio por saldo.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-[#6b7280]">
                      Selecione uma disciplina para acompanhar a distribuicao da carga horaria.
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-[#4f4f59]">
                      Observacoes
                    </span>
                    <textarea
                      value={observacoes}
                      onChange={(event) => setObservacoes(event.target.value)}
                      rows={3}
                      className="w-full rounded-2xl border border-[#e5e5ec] bg-white px-4 py-3 text-sm text-[#171717] outline-none transition focus:border-[#5b61ff]"
                      placeholder="Atividade de extensao, avaliacao, observacao de viagem..."
                    />
                  </label>
                </div>

                <div className="md:col-span-2">
                  <p className="mb-2 text-sm font-medium text-[#4f4f59]">
                    Cursos participantes
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {cursosPermitidosDaDisciplina.map((curso) => {
                      const disabled = !selectedDisciplina?.isIntercurso;

                      return (
                      <label
                        key={curso.id}
                        className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
                          disabled ? 'border-[#eef0f3] bg-[#f7f8fa]' : 'border-[#e5e5ec] bg-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedCourseIds.includes(curso.id)}
                          disabled={disabled}
                          onChange={() => toggleCourse(curso.id)}
                        />
                        <span className="text-sm text-[#171717]">{curso.nome}</span>
                      </label>
                    )})}
                  </div>
                  {!selectedDisciplina?.isIntercurso ? (
                    <p className="mt-2 text-xs text-[#7a7a84]">
                      Para disciplina regular, o calendario usa apenas o curso base. Marque a disciplina como intercurso para compartilhar com mais cursos.
                    </p>
                  ) : null}
                </div>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={submittingModulo || loading}
                    className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#5b61ff,#6b36ff)] px-5 py-3 text-sm font-medium text-white shadow-[0_12px_28px_rgba(91,97,255,0.35)] disabled:opacity-70"
                  >
                    <Plus className="h-4 w-4" />
                    {submittingModulo ? 'Salvando modulo...' : 'Salvar modulo semanal'}
                  </button>
                </div>
              </form>
            </section>

            <section className="rounded-[28px] border border-[#ececf1] bg-[#f7f7fa] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ecfff2] text-[#147a46]">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#16161a]">
                    Cadastros base
                  </h2>
                  <p className="text-sm text-[#6b6b74]">
                    Cursos, professores, disciplinas e bloqueios alimentam o construtor de calendario.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4">
                <form onSubmit={handleCreateCurso} className="space-y-3 rounded-[24px] border border-[#ececf1] bg-white p-4">
                  <p className="text-sm font-semibold text-[#16161a]">Novo curso</p>
                  <AdminInput
                    label="Nome"
                    value={novoCursoNome}
                    onChange={setNovoCursoNome}
                    placeholder="Gestao de Tecnologia da Informacao"
                  />
                  <AdminInput
                    label="Carga total"
                    value={novoCursoCarga}
                    onChange={setNovoCursoCarga}
                    type="number"
                    placeholder="360"
                  />
                  <AdminInput
                    label="Cor"
                    value={novoCursoCor}
                    onChange={setNovoCursoCor}
                    placeholder="#163B65"
                  />
                  <InlineMessage message={courseMessage} />
                  <SmallSubmit submitting={submittingCurso} label="Cadastrar curso" />
                </form>
                <EditableSection title="Cursos cadastrados" emptyMessage="Nenhum curso cadastrado.">
                  {cursos.map((curso) => (
                    <EditableItem
                      key={curso.id}
                      title={curso.nome}
                      subtitle={`${curso.cargaHorariaTotal}h totais`}
                      editing={editingCursoId === curso.id}
                      saving={savingCursoId === curso.id}
                      deleting={deletingKey === `cursos:${curso.id}`}
                      onEdit={() => startCursoEdit(curso)}
                      onCancel={() => setEditingCursoId(null)}
                      onSave={() => handleUpdateCurso(curso.id)}
                      onDelete={() => handleDeleteRegistro('cursos', curso.id, 'Curso')}
                    >
                      {editingCursoId === curso.id ? (
                        <div className="grid gap-3 md:grid-cols-3">
                          <AdminInput label="Nome" value={editCursoNome} onChange={setEditCursoNome} placeholder="Nome do curso" />
                          <AdminInput label="Carga total" value={editCursoCarga} onChange={setEditCursoCarga} type="number" placeholder="360" />
                          <AdminInput label="Cor" value={editCursoCor} onChange={setEditCursoCor} placeholder="#163B65" />
                        </div>
                      ) : null}
                    </EditableItem>
                  ))}
                </EditableSection>

                <form onSubmit={handleCreateDisciplina} className="space-y-3 rounded-[24px] border border-[#ececf1] bg-white p-4">
                  <p className="text-sm font-semibold text-[#16161a]">Nova disciplina</p>
                  <AdminInput
                    label="Nome"
                    value={novaDisciplinaNome}
                    onChange={setNovaDisciplinaNome}
                    placeholder="Analise e Projeto de Computadores"
                  />
                  <AdminInput
                    label="Carga horaria da disciplina"
                    value={novaDisciplinaCarga}
                    onChange={setNovaDisciplinaCarga}
                    type="number"
                    placeholder="72"
                  />
                  <AdminToggle
                    label="Disciplina intercurso"
                    checked={novaDisciplinaIntercurso}
                    onChange={setNovaDisciplinaIntercurso}
                    description="Ative quando a mesma disciplina deve aparecer em mais de um curso."
                  />
                  <CourseSelector
                    courses={cursos}
                    selectedCourseIds={novaDisciplinaCourseIds}
                    onToggle={(cursoId) => toggleDisciplinaCourseSelection(cursoId, 'create')}
                    label="Cursos vinculados"
                  />
                  <InlineMessage message={disciplinaMessage} />
                  <SmallSubmit submitting={submittingDisciplina} label="Cadastrar disciplina" />
                </form>
                <EditableSection title="Disciplinas cadastradas" emptyMessage="Nenhuma disciplina cadastrada.">
                  {disciplinas.map((disciplina) => (
                    <EditableItem
                      key={disciplina.id}
                      title={disciplina.nome}
                      subtitle={
                        `${disciplina.cargaHorariaTotal ? `${disciplina.cargaHorariaTotal}h no semestre` : 'Carga horaria nao definida'} · ${disciplina.isIntercurso ? 'Intercurso' : 'Curso regular'}`
                      }
                      editing={editingDisciplinaId === disciplina.id}
                      saving={savingDisciplinaId === disciplina.id}
                      deleting={deletingKey === `disciplinas:${disciplina.id}`}
                      onEdit={() => startDisciplinaEdit(disciplina)}
                      onCancel={() => setEditingDisciplinaId(null)}
                      onSave={() => handleUpdateDisciplina(disciplina.id)}
                      onDelete={() => handleDeleteRegistro('disciplinas', disciplina.id, 'Disciplina')}
                    >
                      {editingDisciplinaId === disciplina.id ? (
                        <div className="grid gap-3">
                          <div className="grid gap-3 md:grid-cols-2">
                          <AdminInput label="Nome" value={editDisciplinaNome} onChange={setEditDisciplinaNome} placeholder="Nome da disciplina" />
                          <AdminInput label="Carga horaria" value={editDisciplinaCarga} onChange={setEditDisciplinaCarga} type="number" placeholder="72" />
                          </div>
                          <AdminToggle
                            label="Disciplina intercurso"
                            checked={editDisciplinaIntercurso}
                            onChange={setEditDisciplinaIntercurso}
                            description="Quando ativa, a disciplina pode ser usada em varios cursos vinculados."
                          />
                          <CourseSelector
                            courses={cursos}
                            selectedCourseIds={editDisciplinaCourseIds}
                            onToggle={(cursoId) => toggleDisciplinaCourseSelection(cursoId, 'edit')}
                            label="Cursos vinculados"
                          />
                        </div>
                      ) : null}
                    </EditableItem>
                  ))}
                </EditableSection>

                <form onSubmit={handleCreateProfessor} className="space-y-3 rounded-[24px] border border-[#ececf1] bg-white p-4">
                  <p className="text-sm font-semibold text-[#16161a]">Novo professor</p>
                  <AdminInput
                    label="Nome"
                    value={novoProfessorNome}
                    onChange={setNovoProfessorNome}
                    placeholder="Prof. Andre Campos"
                  />
                  <AdminInput
                    label="Cidade de origem"
                    value={novoProfessorCidade}
                    onChange={setNovoProfessorCidade}
                    placeholder="Cuiaba"
                  />
                  <AdminInput
                    label="Especialidade"
                    value={novoProfessorEspecialidade}
                    onChange={setNovoProfessorEspecialidade}
                    placeholder="Infraestrutura"
                  />
                  <InlineMessage message={professorMessage} />
                  <SmallSubmit submitting={submittingProfessor} label="Cadastrar professor" />
                </form>
                <EditableSection title="Professores cadastrados" emptyMessage="Nenhum professor cadastrado.">
                  {professores.map((professor) => (
                    <EditableItem
                      key={professor.id}
                      title={professor.nome}
                      subtitle={professor.especialidade ?? 'Sem especialidade informada'}
                      editing={editingProfessorId === professor.id}
                      saving={savingProfessorId === professor.id}
                      deleting={deletingKey === `professores:${professor.id}`}
                      onEdit={() => startProfessorEdit(professor)}
                      onCancel={() => setEditingProfessorId(null)}
                      onSave={() => handleUpdateProfessor(professor.id)}
                      onDelete={() => handleDeleteRegistro('professores', professor.id, 'Professor')}
                    >
                      {editingProfessorId === professor.id ? (
                        <div className="grid gap-3 md:grid-cols-3">
                          <AdminInput label="Nome" value={editProfessorNome} onChange={setEditProfessorNome} placeholder="Nome do professor" />
                          <AdminInput label="Cidade de origem" value={editProfessorCidade} onChange={setEditProfessorCidade} placeholder="Cidade" />
                          <AdminInput label="Especialidade" value={editProfessorEspecialidade} onChange={setEditProfessorEspecialidade} placeholder="Especialidade" />
                        </div>
                      ) : null}
                    </EditableItem>
                  ))}
                </EditableSection>

                <form onSubmit={handleCreateEvento} className="space-y-3 rounded-[24px] border border-[#ececf1] bg-white p-4">
                  <p className="text-sm font-semibold text-[#16161a]">Evento ou feriado</p>
                  <AdminInput
                    label="Nome"
                    value={novoEventoNome}
                    onChange={setNovoEventoNome}
                    placeholder="FCARP TECH"
                  />
                  <AdminInput
                    label="Data"
                    value={novoEventoData}
                    onChange={setNovoEventoData}
                    type="date"
                    placeholder=""
                  />
                  <AdminSelect
                    label="Tipo"
                    value={novoEventoTipo}
                    onChange={(value) => setNovoEventoTipo(value as 'feriado' | 'evento')}
                    options={[
                      { label: 'Evento', value: 'evento' },
                      { label: 'Feriado', value: 'feriado' },
                    ]}
                  />
                  <InlineMessage message={eventoMessage} />
                  <SmallSubmit submitting={submittingEvento} label="Cadastrar registro" />
                </form>
                <EditableSection title="Eventos e feriados cadastrados" emptyMessage="Nenhum evento ou feriado cadastrado.">
                  {eventos.map((evento) => (
                    <EditableItem
                      key={evento.id}
                      title={evento.nome}
                      subtitle={`${evento.data} · ${evento.tipo}`}
                      editing={editingEventoId === evento.id}
                      saving={savingEventoId === evento.id}
                      deleting={deletingKey === `eventos_feriados:${evento.id}`}
                      onEdit={() => startEventoEdit(evento)}
                      onCancel={() => setEditingEventoId(null)}
                      onSave={() => handleUpdateEvento(evento.id)}
                      onDelete={() => handleDeleteRegistro('eventos_feriados', evento.id, 'Evento')}
                    >
                      {editingEventoId === evento.id ? (
                        <div className="grid gap-3 md:grid-cols-3">
                          <AdminInput label="Nome" value={editEventoNome} onChange={setEditEventoNome} placeholder="Nome do evento" />
                          <AdminInput label="Data" value={editEventoData} onChange={setEditEventoData} type="date" placeholder="" />
                          <AdminSelect
                            label="Tipo"
                            value={editEventoTipo}
                            onChange={(value) => setEditEventoTipo(value as 'feriado' | 'evento')}
                            options={[
                              { label: 'Evento', value: 'evento' },
                              { label: 'Feriado', value: 'feriado' },
                            ]}
                          />
                        </div>
                      ) : null}
                    </EditableItem>
                  ))}
                </EditableSection>
              </div>
            </section>
          </div>

          <div className="space-y-4">
            <section className="rounded-[28px] bg-[linear-gradient(135deg,#111827,#1f2937)] p-5 text-white">
              <div className="grid gap-3 sm:grid-cols-4">
                <AdminStat
                  icon={<Users className="h-4 w-4" />}
                  label="Cursos"
                  value={String(cursos.length)}
                />
                <AdminStat
                  icon={<CalendarDays className="h-4 w-4" />}
                  label="Modulos"
                  value={String(modulos.length)}
                />
                <AdminStat
                  icon={<AlertTriangle className="h-4 w-4" />}
                  label="Bloqueios"
                  value={String(eventos.length)}
                />
                <AdminStat
                  icon={<GitBranch className="h-4 w-4" />}
                  label="Intercursos"
                  value={String(intercursos.length)}
                />
              </div>
            </section>

            <section className="rounded-[28px] border border-[#ececf1] bg-[#f7f7fa] p-5">
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#16161a]">
                Progresso por disciplina
              </h2>
              <div className="mt-4 space-y-3">
                {disciplinaProgressCards.length ? (
                  disciplinaProgressCards.map(({ disciplina, progress }) => (
                    <div key={disciplina.id} className="rounded-[22px] bg-white px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-[#16161a]">{disciplina.nome}</p>
                          <p className="mt-1 text-xs text-[#7a7a84]">
                            {progress.scheduled}h de {progress.total}h
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-[#5b61ff]">
                          {progress.percentual}%
                        </span>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-[#edf0f3]">
                        <div
                          className="h-2 rounded-full bg-[linear-gradient(90deg,#163B65,#2C6E91)]"
                          style={{ width: `${progress.percentual}%` }}
                        />
                      </div>
                      <p className="mt-2 text-[11px] text-[#8a8f98]">
                        Restante: {progress.remaining}h
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[22px] bg-white px-4 py-4 text-sm text-[#7a7a84]">
                    Cadastre a carga horaria nas disciplinas para acompanhar o progresso por componente.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[28px] border border-[#ececf1] bg-[#f7f7fa] p-5">
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#16161a]">
                Eventos e bloqueios
              </h2>
              <div className="mt-4 space-y-3">
                {eventos.slice(0, 6).map((evento) => (
                  <div key={evento.id} className="rounded-[22px] bg-white px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-[#16161a]">{evento.nome}</p>
                        <p className="mt-1 text-xs text-[#7a7a84]">{evento.data}</p>
                      </div>
                      <span className="rounded-full bg-[#eef0ff] px-3 py-1 text-xs font-medium text-[#5b61ff]">
                        {evento.tipo}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[28px] border border-[#ececf1] bg-[#f7f7fa] p-5">
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#16161a]">
                Linha do tempo recente
              </h2>
              <div className="mt-4 space-y-3">
                {cronogramaCards.slice(0, 6).map((card) => (
                  <div key={card.id} className="rounded-[22px] bg-white px-4 py-4">
                    <p className="text-sm font-medium text-[#16161a]">{card.disciplinaNome}</p>
                    <p className="mt-1 text-xs text-[#7a7a84]">
                      {formatDateRange(card.dataInicio, card.dataFim)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {card.cursos.map((curso) => (
                        <span
                          key={`${card.id}-${curso.id}`}
                          className="rounded-full px-3 py-1 text-xs font-medium text-white"
                          style={{ backgroundColor: curso.corHex ?? '#163B65' }}
                        >
                          {curso.nome}
                        </span>
                      ))}
                    </div>
                    {card.professorNome ? (
                      <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#f6f8fb] px-3 py-1 text-xs text-[#5d5d66]">
                        <Check className="h-3.5 w-3.5" />
                        {card.professorNome}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function AdminInput({
  label,
  onChange,
  placeholder,
  readOnly = false,
  type = 'text',
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  readOnly?: boolean;
  type?: React.HTMLInputTypeAttribute;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[#4f4f59]">{label}</span>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-[#e5e5ec] bg-white px-4 py-3 text-sm text-[#171717] outline-none transition focus:border-[#5b61ff] read-only:bg-[#f3f4f8]"
      />
    </label>
  );
}

function AdminSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[#4f4f59]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-[#e5e5ec] bg-white px-4 py-3 text-sm text-[#171717] outline-none transition focus:border-[#5b61ff]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SmallSubmit({
  label,
  submitting,
}: {
  label: string;
  submitting: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={submitting}
      className="inline-flex items-center gap-2 rounded-full bg-[#121216] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-70"
    >
      <Plus className="h-4 w-4" />
      {label}
    </button>
  );
}

function AdminToggle({
  checked,
  description,
  label,
  onChange,
}: {
  checked: boolean;
  description: string;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-2xl border border-[#e5e5ec] bg-white px-4 py-3">
      <div>
        <p className="text-sm font-medium text-[#16161a]">{label}</p>
        <p className="mt-1 text-xs text-[#7a7a84]">{description}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

function CourseSelector({
  courses,
  label,
  onToggle,
  selectedCourseIds,
}: {
  courses: Curso[];
  label: string;
  onToggle: (cursoId: string) => void;
  selectedCourseIds: string[];
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-[#4f4f59]">{label}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {courses.map((curso) => (
          <label
            key={curso.id}
            className="flex items-center gap-3 rounded-2xl border border-[#e5e5ec] bg-white px-4 py-3"
          >
            <input
              type="checkbox"
              checked={selectedCourseIds.includes(curso.id)}
              onChange={() => onToggle(curso.id)}
            />
            <span className="text-sm text-[#171717]">{curso.nome}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function MetricPill({
  label,
  value,
  emphasis = false,
}: {
  emphasis?: boolean;
  label: string;
  value: string;
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        emphasis ? 'border-[#c8d5e3] bg-[#eef4f9]' : 'border-[#e5e9ef] bg-white'
      }`}
    >
      <p className="text-[11px] uppercase tracking-[0.08em] text-[#7a7f88]">{label}</p>
      <p className="mt-1 text-base font-semibold text-[#16161a]">{value}</p>
    </div>
  );
}

function InlineMessage({ message }: { message: string }) {
  if (!message) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-[#ececf1] bg-[#f8fafc] px-4 py-3 text-sm text-[#5d5d66]">
      {message}
    </div>
  );
}

function EditableSection({
  title,
  emptyMessage,
  children,
}: {
  title: string;
  emptyMessage: string;
  children: React.ReactNode;
}) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];

  return (
    <section className="rounded-[24px] border border-[#ececf1] bg-white p-4">
      <p className="text-sm font-semibold text-[#16161a]">{title}</p>
      <div className="mt-4 space-y-3">
        {items.length > 0 ? (
          items
        ) : (
          <div className="rounded-2xl border border-[#ececf1] bg-[#f8fafc] px-4 py-4 text-sm text-[#5d5d66]">
            {emptyMessage}
          </div>
        )}
      </div>
    </section>
  );
}

function EditableItem({
  children,
  deleting = false,
  editing = false,
  onCancel,
  onDelete,
  onEdit,
  onSave,
  saving = false,
  subtitle,
  title,
}: {
  children?: React.ReactNode;
  deleting?: boolean;
  editing?: boolean;
  onCancel: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onSave: () => void;
  saving?: boolean;
  subtitle?: string;
  title: string;
}) {
  return (
    <div className="rounded-[20px] border border-[#ececf1] bg-[#f8fafc] px-4 py-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-medium text-[#16161a]">{title}</p>
          {subtitle ? <p className="mt-1 text-xs text-[#7a7a84]">{subtitle}</p> : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {editing ? (
            <>
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-[#121216] px-4 py-2 text-sm font-medium text-white disabled:opacity-70"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full border border-[#d9e1e8] bg-white px-4 py-2 text-sm font-medium text-[#171717]"
              >
                <X className="h-4 w-4" />
                Cancelar
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-2 rounded-full border border-[#d9e1e8] bg-white px-4 py-2 text-sm font-medium text-[#171717]"
            >
              <Edit3 className="h-4 w-4" />
              Editar
            </button>
          )}

          <button
            type="button"
            onClick={onDelete}
            disabled={deleting || saving}
            className="inline-flex items-center gap-2 rounded-full border border-[#f0d5d5] bg-white px-4 py-2 text-sm font-medium text-[#9c2f2f] disabled:opacity-70"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>

      {editing && children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

function AdminStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] bg-white/8 px-4 py-3">
      <div className="flex items-center gap-2 text-white/55">
        {icon}
        <span className="text-xs uppercase tracking-[0.18em]">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">
        {value}
      </p>
    </div>
  );
}
