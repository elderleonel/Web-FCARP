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
  getCourseProgress,
  getCourseSemesterProgress,
  getDisciplinaProgress,
  getNextSuggestedModuleStartDate,
  getSemesterLabel,
  isDateWithinRange,
  rangesOverlap,
  type CronogramaModulo,
  type Curso,
  type CursoSemestre,
  type Disciplina,
  type EventoFeriado,
  type Intercurso,
  type Professor,
} from '@/lib/unisched-data';

type AdminDashboardClientProps = {
  userEmail: string;
};

type AdminView = 'visao' | 'calendario' | 'disciplinas' | 'apoio';
type AdminSupportSection =
  | 'cursos'
  | 'semestres'
  | 'disciplinas'
  | 'professores'
  | 'eventos';

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
  const [courseSemesters, setCourseSemesters] = useState<CursoSemestre[]>([]);
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
  const [submittingSemester, setSubmittingSemester] = useState(false);
  const [submittingDisciplina, setSubmittingDisciplina] = useState(false);
  const [submittingEvento, setSubmittingEvento] = useState(false);
  const [submittingModulo, setSubmittingModulo] = useState(false);
  const [courseMessage, setCourseMessage] = useState('');
  const [professorMessage, setProfessorMessage] = useState('');
  const [semesterMessage, setSemesterMessage] = useState('');
  const [disciplinaMessage, setDisciplinaMessage] = useState('');
  const [eventoMessage, setEventoMessage] = useState('');
  const [activeView, setActiveView] = useState<AdminView>('visao');
  const [activeSupportSection, setActiveSupportSection] =
    useState<AdminSupportSection>('cursos');
  const [editingCursoId, setEditingCursoId] = useState<string | null>(null);
  const [editingProfessorId, setEditingProfessorId] = useState<string | null>(null);
  const [editingSemesterId, setEditingSemesterId] = useState<string | null>(null);
  const [editingDisciplinaId, setEditingDisciplinaId] = useState<string | null>(null);
  const [editingEventoId, setEditingEventoId] = useState<string | null>(null);
  const [savingCursoId, setSavingCursoId] = useState<string | null>(null);
  const [savingProfessorId, setSavingProfessorId] = useState<string | null>(null);
  const [savingSemesterId, setSavingSemesterId] = useState<string | null>(null);
  const [savingDisciplinaId, setSavingDisciplinaId] = useState<string | null>(null);
  const [savingEventoId, setSavingEventoId] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const [novoCursoNome, setNovoCursoNome] = useState('');
  const [novoCursoCarga, setNovoCursoCarga] = useState('360');
  const [novoCursoCor, setNovoCursoCor] = useState('#163B65');
  const [duplicarSemestresNovoCurso, setDuplicarSemestresNovoCurso] = useState(true);
  const [editCursoNome, setEditCursoNome] = useState('');
  const [editCursoCarga, setEditCursoCarga] = useState('360');
  const [editCursoCor, setEditCursoCor] = useState('#163B65');

  const [novoProfessorNome, setNovoProfessorNome] = useState('');
  const [novoProfessorEspecialidade, setNovoProfessorEspecialidade] = useState('');
  const [editProfessorNome, setEditProfessorNome] = useState('');
  const [editProfessorEspecialidade, setEditProfessorEspecialidade] = useState('');

  const [novoSemesterNumero, setNovoSemesterNumero] = useState('1');
  const [novoSemesterNome, setNovoSemesterNome] = useState('');
  const [novoSemesterAtivo, setNovoSemesterAtivo] = useState(true);
  const [editSemesterNumero, setEditSemesterNumero] = useState('1');
  const [editSemesterNome, setEditSemesterNome] = useState('');
  const [editSemesterAtivo, setEditSemesterAtivo] = useState(true);

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
  const [selectedCourseSemesterId, setSelectedCourseSemesterId] = useState('');
  const [cargaHorariaDiaria, setCargaHorariaDiaria] = useState('4');
  const [sala, setSala] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [selectedWeekDays, setSelectedWeekDays] = useState<number[]>([1, 2, 3, 4, 5]);

  const selectedCurso = useMemo(
    () => cursos.find((curso) => curso.id === cursoBaseId) ?? null,
    [cursoBaseId, cursos]
  );

  const courseSemestersForSelectedCourse = useMemo(
    () =>
      courseSemesters
        .filter((courseSemester) => courseSemester.cursoId === cursoBaseId)
        .sort((left, right) => left.numero - right.numero),
    [courseSemesters, cursoBaseId]
  );

  const selectedCourseSemester = useMemo(
    () =>
      courseSemestersForSelectedCourse.find(
        (courseSemester) => courseSemester.id === selectedCourseSemesterId
      ) ??
      courseSemestersForSelectedCourse[0] ??
      null,
    [courseSemestersForSelectedCourse, selectedCourseSemesterId]
  );

  const disciplinasDisponiveis = useMemo(() => {
    if (!cursoBaseId) {
      return disciplinas;
    }

    return disciplinas.filter((disciplina) => disciplina.courseIds.includes(cursoBaseId));
  }, [cursoBaseId, disciplinas]);

  const disciplinaProgressCards = useMemo(
    () =>
      disciplinasDisponiveis
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
    [disciplinasDisponiveis, modulos]
  );

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

  const disciplinasRegularesDoCurso = useMemo(
    () => disciplinasDisponiveis.filter((disciplina) => !disciplina.isIntercurso),
    [disciplinasDisponiveis]
  );

  const disciplinasIntercursoDoCurso = useMemo(
    () => disciplinasDisponiveis.filter((disciplina) => disciplina.isIntercurso),
    [disciplinasDisponiveis]
  );

  const currentCourseCards = useMemo(
    () =>
      cursoBaseId
        ? buildCronogramaCards(
            cursoBaseId,
            cursos,
            disciplinas,
            professores,
            modulos,
            intercursos
          )
        : [],
    [cursoBaseId, cursos, disciplinas, professores, modulos, intercursos]
  );

  const currentCourseProgress = useMemo(
    () =>
      selectedCurso ? getCourseProgress(selectedCurso, modulos, intercursos) : null,
    [selectedCurso, modulos, intercursos]
  );

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
  const semesterProgressCards = useMemo(
    () =>
      courseSemestersForSelectedCourse.map((courseSemester) => ({
        courseSemester,
        progress: getCourseSemesterProgress(courseSemester, modulos, disciplinasDisponiveis),
      })),
    [courseSemestersForSelectedCourse, modulos, disciplinasDisponiveis]
  );
  const professorConflictDetails = useMemo(() => {
    if (!professorId || !dataInicio || !dataFim) {
      return null;
    }

    const conflict = modulos.find(
      (modulo) =>
        modulo.professorId === professorId &&
        rangesOverlap(modulo.dataInicio, modulo.dataFim, dataInicio, dataFim)
    );

    if (!conflict) {
      return null;
    }

    const professor = professores.find((item) => item.id === conflict.professorId) ?? null;
    const disciplina = disciplinas.find((item) => item.id === conflict.disciplinaId) ?? null;
    const conflictCourses = intercursos
      .filter((item) => item.cronogramaModuloId === conflict.id)
      .map((item) => cursos.find((curso) => curso.id === item.cursoId)?.nome ?? null)
      .filter((value): value is string => Boolean(value));
    const conflictSemester =
      courseSemesters.find((item) => item.id === conflict.cursoSemestreId)?.numero ??
      conflict.semestre ??
      null;

    return {
      cursoLabel: conflictCourses.length ? conflictCourses.join(', ') : 'Curso nao identificado',
      disciplinaNome: disciplina?.nome ?? 'Disciplina nao identificada',
      periodo: formatDateRange(conflict.dataInicio, conflict.dataFim),
      professorNome: professor?.nome ?? 'Professor nao identificado',
      sala: conflict.sala ?? 'Sala nao informada',
      semestreLabel: getSemesterLabel(conflictSemester),
    };
  }, [
    courseSemesters,
    cursos,
    dataFim,
    dataInicio,
    disciplinas,
    intercursos,
    modulos,
    professorId,
    professores,
  ]);
  const roomConflictDetails = useMemo(() => {
    if (!sala.trim() || !dataInicio || !dataFim) {
      return null;
    }

    const normalizedRoom = sala.trim().toLowerCase();
    const conflict = modulos.find(
      (modulo) =>
        (modulo.sala ?? '').trim().toLowerCase() === normalizedRoom &&
        rangesOverlap(modulo.dataInicio, modulo.dataFim, dataInicio, dataFim)
    );

    if (!conflict) {
      return null;
    }

    const professor = professores.find((item) => item.id === conflict.professorId) ?? null;
    const disciplina = disciplinas.find((item) => item.id === conflict.disciplinaId) ?? null;
    const conflictCourses = intercursos
      .filter((item) => item.cronogramaModuloId === conflict.id)
      .map((item) => cursos.find((curso) => curso.id === item.cursoId)?.nome ?? null)
      .filter((value): value is string => Boolean(value));
    const conflictSemester =
      courseSemesters.find((item) => item.id === conflict.cursoSemestreId)?.numero ??
      conflict.semestre ??
      null;

    return {
      cursoLabel: conflictCourses.length ? conflictCourses.join(', ') : 'Curso nao identificado',
      disciplinaNome: disciplina?.nome ?? 'Disciplina nao identificada',
      periodo: formatDateRange(conflict.dataInicio, conflict.dataFim),
      professorNome: professor?.nome ?? 'Professor nao identificado',
      sala: conflict.sala ?? 'Sala nao informada',
      semestreLabel: getSemesterLabel(conflictSemester),
    };
  }, [
    courseSemesters,
    cursos,
    dataFim,
    dataInicio,
    disciplinas,
    intercursos,
    modulos,
    professores,
    sala,
  ]);
  const supportSummary = useMemo(
    () => [
      { key: 'cursos' as const, label: 'Cursos', value: String(cursos.length) },
      {
        key: 'semestres' as const,
        label: 'Semestres',
        value: String(courseSemesters.length),
      },
      { key: 'disciplinas' as const, label: 'Disciplinas', value: String(disciplinas.length) },
      { key: 'professores' as const, label: 'Professores', value: String(professores.length) },
      { key: 'eventos' as const, label: 'Bloqueios', value: String(eventos.length) },
    ],
    [cursos.length, courseSemesters.length, disciplinas.length, professores.length, eventos.length]
  );

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
      setCourseSemesters(platformData.courseSemesters);
      setProfessores(platformData.professores);
      setDisciplinas(platformData.disciplinas);
      setEventos(platformData.eventosFeriados);
      setModulos(platformData.cronogramaModulos);
      setIntercursos(platformData.intercursos);
      setStatusMessage(platformData.message);

      if (!cursoBaseId && platformData.cursos.length > 0) {
        setCursoBaseId(platformData.cursos[0].id);
      }

      const courseIdInFocus = cursoBaseId || platformData.cursos[0]?.id || '';
      const semestersInFocus = platformData.courseSemesters
        .filter((courseSemester) => courseSemester.cursoId === courseIdInFocus)
        .sort((left, right) => left.numero - right.numero);

      if (!selectedCourseSemesterId && semestersInFocus.length > 0) {
        setSelectedCourseSemesterId(semestersInFocus[0].id);
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
  }, [
    router,
    userEmail,
    dataInicio,
    disciplinaId,
    professorId,
    selectedCourseIds.length,
    cursoBaseId,
    selectedCourseSemesterId,
  ]);

  async function reloadPlatformData() {
    const platformData = await loadPlatformData();
    setCursos(platformData.cursos);
    setCourseSemesters(platformData.courseSemesters);
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
    setEditingSemesterId(null);
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
    setEditProfessorEspecialidade(professor.especialidade ?? '');
    setProfessorMessage('');
  }

  function startSemesterEdit(courseSemester: CursoSemestre) {
    resetEditingStates();
    setEditingSemesterId(courseSemester.id);
    setEditSemesterNumero(String(courseSemester.numero));
    setEditSemesterNome(courseSemester.nome ?? '');
    setEditSemesterAtivo(courseSemester.ativo);
    setSemesterMessage('');
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

  async function handleCreateSemester(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    if (!cursoBaseId) {
      setSemesterMessage('Selecione um curso em foco para cadastrar o semestre.');
      return;
    }

    if (Number(novoSemesterNumero) <= 0) {
      setSemesterMessage('Informe um numero de semestre valido.');
      return;
    }

    setSubmittingSemester(true);
    setSemesterMessage('Salvando semestre...');

    const { data, error } = await supabase
      .from('curso_semestres')
      .insert({
        ativo: novoSemesterAtivo,
        curso_id: cursoBaseId,
        nome: novoSemesterNome.trim() || null,
        numero: Number(novoSemesterNumero),
      })
      .select('id')
      .single();

    if (error) {
      setSubmittingSemester(false);
      setSemesterMessage(formatRequestMessage(error.message));
      return;
    }

    setNovoSemesterNumero('1');
    setNovoSemesterNome('');
    setNovoSemesterAtivo(true);
    await reloadPlatformData();
    if (data?.id) {
      setSelectedCourseSemesterId(data.id);
    }
    setSubmittingSemester(false);
    setSemesterMessage('Semestre cadastrado com sucesso.');
    setStatusMessage('Semestre cadastrado com sucesso.');
  }

  async function handleUpdateSemester(courseSemesterId: string) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    if (Number(editSemesterNumero) <= 0) {
      setSemesterMessage('Informe um numero de semestre valido.');
      return;
    }

    setSavingSemesterId(courseSemesterId);
    setSemesterMessage('Atualizando semestre...');

    const { error } = await supabase
      .from('curso_semestres')
      .update({
        ativo: editSemesterAtivo,
        nome: editSemesterNome.trim() || null,
        numero: Number(editSemesterNumero),
      })
      .eq('id', courseSemesterId);

    if (error) {
      setSavingSemesterId(null);
      setSemesterMessage(formatRequestMessage(error.message));
      return;
    }

    await reloadPlatformData();
    setSavingSemesterId(null);
    setEditingSemesterId(null);
    setSemesterMessage('Semestre atualizado com sucesso.');
    setStatusMessage('Semestre atualizado com sucesso.');
  }

  async function handleDeleteSemester(courseSemesterId: string) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    const confirmed = window.confirm('Deseja excluir este semestre do curso?');

    if (!confirmed) {
      return;
    }

    setDeletingKey(`curso_semestres:${courseSemesterId}`);
    const { error } = await supabase
      .from('curso_semestres')
      .delete()
      .eq('id', courseSemesterId);

    if (error) {
      setDeletingKey(null);
      setSemesterMessage(formatRequestMessage(error.message));
      return;
    }

    await reloadPlatformData();
    setDeletingKey(null);
    setEditingSemesterId(null);
    setSemesterMessage('Semestre excluido com sucesso.');
    setStatusMessage('Semestre excluido com sucesso.');
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
    const { data: newCourse, error } = await supabase
      .from('cursos')
      .insert({
        nome: novoCursoNome.trim(),
        carga_horaria_total: Number(novoCursoCarga),
        cor_hex: novoCursoCor || null,
      })
      .select('id')
      .single();

    if (error || !newCourse) {
      setSubmittingCurso(false);
      setCourseMessage(formatRequestMessage(error?.message ?? 'Nao foi possivel salvar o curso.'));
      return;
    }

    if (duplicarSemestresNovoCurso && selectedCurso) {
      const sourceSemesters = courseSemesters
        .filter((courseSemester) => courseSemester.cursoId === selectedCurso.id)
        .sort((left, right) => left.numero - right.numero);

      if (sourceSemesters.length) {
        const { error: copySemestersError } = await supabase
          .from('curso_semestres')
          .insert(
            sourceSemesters.map((courseSemester) => ({
              ativo: courseSemester.ativo,
              curso_id: newCourse.id,
              nome: courseSemester.nome,
              numero: courseSemester.numero,
            }))
          );

        if (copySemestersError) {
          setSubmittingCurso(false);
          setCourseMessage(formatRequestMessage(copySemestersError.message));
          return;
        }
      }
    }

    setNovoCursoNome('');
    setNovoCursoCarga('360');
    setNovoCursoCor('#163B65');
    setDuplicarSemestresNovoCurso(true);
    await reloadPlatformData();
    setSubmittingCurso(false);
    setCourseMessage(
      duplicarSemestresNovoCurso && selectedCurso
        ? 'Curso cadastrado com sucesso e estrutura de semestres duplicada.'
        : 'Curso cadastrado com sucesso.'
    );
    setStatusMessage(
      duplicarSemestresNovoCurso && selectedCurso
        ? 'Curso cadastrado com sucesso e estrutura de semestres duplicada.'
        : 'Curso cadastrado com sucesso.'
    );
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
      especialidade: novoProfessorEspecialidade || null,
    });

    if (error) {
      setSubmittingProfessor(false);
      setProfessorMessage(formatRequestMessage(error.message));
      return;
    }

    setNovoProfessorNome('');
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

    if (!selectedCourseSemester) {
      setStatusMessage('Cadastre e selecione um semestre do curso antes de montar o calendario.');
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

    if (professorConflictDetails) {
      setStatusMessage(
        `${professorConflictDetails.professorNome} ja esta alocado em ${professorConflictDetails.cursoLabel}, ${professorConflictDetails.semestreLabel}, sala ${professorConflictDetails.sala}, no periodo ${professorConflictDetails.periodo}.`
      );
      return;
    }

    if (roomConflictDetails) {
      setStatusMessage(
        `A sala ${roomConflictDetails.sala} ja esta ocupada em ${roomConflictDetails.cursoLabel}, ${roomConflictDetails.semestreLabel}, com ${roomConflictDetails.professorNome}, no periodo ${roomConflictDetails.periodo}.`
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
        curso_semestre_id: selectedCourseSemester.id,
        semestre: selectedCourseSemester.numero,
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
    setSelectedCourseSemesterId(selectedCourseSemester.id);
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
    const nextCourseSemesters = courseSemesters
      .filter((courseSemester) => courseSemester.cursoId === value)
      .sort((left, right) => left.numero - right.numero);
    setSelectedCourseSemesterId(nextCourseSemesters[0]?.id ?? '');
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

        <section className="mt-6 rounded-[28px] border border-[#e7ebf0] bg-white p-3">
          <div className="grid gap-2 md:grid-cols-4">
            <AdminViewButton
              active={activeView === 'visao'}
              label="Resumo"
              onClick={() => setActiveView('visao')}
            />
            <AdminViewButton
              active={activeView === 'disciplinas'}
              label="Disciplinas"
              onClick={() => setActiveView('disciplinas')}
            />
            <AdminViewButton
              active={activeView === 'calendario'}
              label="Planejamento"
              onClick={() => setActiveView('calendario')}
            />
            <AdminViewButton
              active={activeView === 'apoio'}
              label="Cadastros"
              onClick={() => setActiveView('apoio')}
            />
          </div>
        </section>

        <div className={`mt-8 grid gap-4 ${activeView === 'apoio' ? '' : 'xl:grid-cols-[1.15fr_0.85fr]'}`}>
          <div className="space-y-4">
            <section className="rounded-[28px] border border-[#e4e9f0] bg-[linear-gradient(135deg,#fcfdff,#f2f6fb)] p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#163b65]">Contexto do curso</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#16161a]">
                    {selectedCurso?.nome ?? 'Selecione um curso para organizar o admin'}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm text-[#5d6671]">
                    {activeView === 'calendario'
                      ? 'Monte o cronograma com base no curso em foco e acompanhe a carga da disciplina.'
                      : activeView === 'disciplinas'
                        ? 'Revise o mapa de disciplinas regulares e intercurso do curso selecionado.'
                        : activeView === 'apoio'
                          ? 'Gerencie os cadastros base do sistema sem misturar tudo na mesma tela.'
                          : 'Tenha uma leitura unica do curso antes de editar disciplinas ou montar modulos.'}
                  </p>
                </div>
                <div className="min-w-[280px] rounded-[24px] border border-white/80 bg-white/80 p-4">
                  <AdminSelect
                    label="Curso em foco"
                    value={cursoBaseId}
                    onChange={handleCursoBaseChange}
                    options={cursos.map((item) => ({ label: item.nome, value: item.id }))}
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <MetricPill
                  label="Disciplinas do curso"
                  value={String(disciplinasRegularesDoCurso.length)}
                />
                <MetricPill
                  label="Intercurso"
                  value={String(disciplinasIntercursoDoCurso.length)}
                />
                <MetricPill
                  label="Modulos do curso"
                  value={String(currentCourseCards.length)}
                />
                <MetricPill
                  label="Carga do curso"
                  value={
                    currentCourseProgress
                      ? `${currentCourseProgress.totalAgendado}h / ${currentCourseProgress.totalCurso}h`
                      : '--'
                  }
                />
              </div>
            </section>

            {activeView === 'calendario' ? (
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
                <AdminSelect
                  label="Turma / semestre"
                  value={selectedCourseSemester?.id ?? ''}
                  onChange={setSelectedCourseSemesterId}
                  options={
                    courseSemestersForSelectedCourse.length
                      ? courseSemestersForSelectedCourse.map((courseSemester) => ({
                          label: `${getSemesterLabel(courseSemester.numero)}${
                            courseSemester.nome ? ` - ${courseSemester.nome}` : ''
                          }${courseSemester.ativo ? '' : ' (inativo)'}`,
                          value: courseSemester.id,
                        }))
                      : [{ label: 'Cadastre um semestre para este curso', value: '' }]
                  }
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
                        <span className="rounded-full bg-white px-3 py-1 text-xs text-[#5d6671]">
                          Turma:{' '}
                          {selectedCourseSemester
                            ? getSemesterLabel(selectedCourseSemester.numero)
                            : '--'}
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
                {professorConflictDetails ? (
                  <div className="md:col-span-2 rounded-[20px] border border-[#f3d8d8] bg-[#fff6f6] px-4 py-4 text-sm text-[#8a3434]">
                    <p className="font-medium">Conflito de professor detectado</p>
                    <p className="mt-2">
                      {professorConflictDetails.professorNome} ja possui aula em{' '}
                      {professorConflictDetails.cursoLabel}, {professorConflictDetails.semestreLabel},
                      sala {professorConflictDetails.sala}, no periodo{' '}
                      {professorConflictDetails.periodo}.
                    </p>
                    <p className="mt-1">
                      Ajuste a turma, a sala, o professor ou a data antes de salvar.
                    </p>
                  </div>
                ) : null}
                {roomConflictDetails ? (
                  <div className="md:col-span-2 rounded-[20px] border border-[#f3e2cf] bg-[#fff8ef] px-4 py-4 text-sm text-[#8a5a1f]">
                    <p className="font-medium">Conflito de sala detectado</p>
                    <p className="mt-2">
                      A sala {roomConflictDetails.sala} ja esta ocupada em{' '}
                      {roomConflictDetails.cursoLabel}, {roomConflictDetails.semestreLabel},
                      com {roomConflictDetails.professorNome}, no periodo{' '}
                      {roomConflictDetails.periodo}.
                    </p>
                    <p className="mt-1">
                      Escolha outra sala ou reorganize a agenda antes de salvar.
                    </p>
                  </div>
                ) : null}
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
            ) : null}

            {activeView === 'disciplinas' ? (
            <section className="rounded-[28px] border border-[#ececf1] bg-[#f7f7fa] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ecfff2] text-[#147a46]">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#16161a]">
                    Mapa de disciplinas do curso
                  </h2>
                  <p className="text-sm text-[#6b6b74]">
                    Revise rapidamente o que pertence ao curso em foco e o que entra como intercurso antes de montar o calendario.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  <EditableSection
                    title={`Disciplinas do curso ${selectedCurso?.nome ?? ''}`}
                    emptyMessage="Nenhuma disciplina regular vinculada ao curso selecionado."
                  >
                    {disciplinasRegularesDoCurso.map((disciplina) => (
                      <EditableItem
                        key={disciplina.id}
                        title={disciplina.nome}
                        subtitle={
                          disciplina.cargaHorariaTotal
                            ? `${disciplina.cargaHorariaTotal}h no semestre`
                            : 'Carga horaria nao definida'
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
                        ) : (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {disciplina.courseIds.map((cursoId) => {
                              const curso = cursos.find((item) => item.id === cursoId);
                              return curso ? (
                                <span
                                  key={`${disciplina.id}-${curso.id}`}
                                  className="rounded-full bg-[#eef4fb] px-3 py-1 text-xs text-[#163b65]"
                                >
                                  {curso.nome}
                                </span>
                              ) : null;
                            })}
                          </div>
                        )}
                      </EditableItem>
                    ))}
                  </EditableSection>

                  <EditableSection
                    title={`Disciplinas intercurso de ${selectedCurso?.nome ?? ''}`}
                    emptyMessage="Nenhuma disciplina intercurso vinculada ao curso selecionado."
                  >
                    {disciplinasIntercursoDoCurso.map((disciplina) => (
                      <EditableItem
                        key={disciplina.id}
                        title={disciplina.nome}
                        subtitle={
                          disciplina.cargaHorariaTotal
                            ? `${disciplina.cargaHorariaTotal}h no semestre · Intercurso`
                            : 'Carga horaria nao definida · Intercurso'
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
                        ) : (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {disciplina.courseIds.map((cursoId) => {
                              const curso = cursos.find((item) => item.id === cursoId);
                              return curso ? (
                                <span
                                  key={`${disciplina.id}-${curso.id}`}
                                  className="rounded-full bg-[#f2f5ff] px-3 py-1 text-xs text-[#4b56d2]"
                                >
                                  {curso.nome}
                                </span>
                              ) : null;
                            })}
                          </div>
                        )}
                      </EditableItem>
                    ))}
                  </EditableSection>
                </div>
              </div>
            </section>
            ) : null}

            {activeView === 'apoio' ? (
            <section className="rounded-[28px] border border-[#ececf1] bg-[#f7f7fa] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff7e8] text-[#9a6c00]">
                  <Edit3 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#16161a]">
                    Apoio administrativo
                  </h2>
                  <p className="text-sm text-[#6b6b74]">
                    Escolha o cadastro que deseja editar. A tela mostra um bloco por vez.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-2 md:grid-cols-5">
                {supportSummary.map((item) => (
                  <AdminSubViewButton
                    key={item.key}
                    active={activeSupportSection === item.key}
                    label={item.label}
                    value={item.value}
                    onClick={() => setActiveSupportSection(item.key)}
                  />
                ))}
              </div>

              <div className="mt-5 grid gap-4">
                {activeSupportSection === 'cursos' ? (
                <>
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
                  <AdminToggle
                    label="Duplicar semestres do curso em foco"
                    checked={duplicarSemestresNovoCurso}
                    onChange={setDuplicarSemestresNovoCurso}
                    description={
                      selectedCurso
                        ? `Copia a estrutura de semestres de ${selectedCurso.nome} para o novo curso.`
                        : 'Selecione um curso em foco para usar sua estrutura como base.'
                    }
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
                </>
                ) : null}

                {activeSupportSection === 'semestres' ? (
                <>
                <form onSubmit={handleCreateSemester} className="space-y-3 rounded-[24px] border border-[#ececf1] bg-white p-4">
                  <p className="text-sm font-semibold text-[#16161a]">Semestre do curso em foco</p>
                  <div className="rounded-2xl border border-[#e5e9ef] bg-[#f8fafc] px-4 py-3 text-sm text-[#5d6671]">
                    {selectedCurso
                      ? `Curso atual: ${selectedCurso.nome}`
                      : 'Selecione um curso em foco para gerenciar os semestres.'}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <AdminInput
                      label="Numero"
                      value={novoSemesterNumero}
                      onChange={setNovoSemesterNumero}
                      type="number"
                      placeholder="1"
                    />
                    <AdminInput
                      label="Nome interno"
                      value={novoSemesterNome}
                      onChange={setNovoSemesterNome}
                      placeholder="Turma A / Entrada 2026"
                    />
                  </div>
                  <AdminToggle
                    label="Semestre ativo"
                    checked={novoSemesterAtivo}
                    onChange={setNovoSemesterAtivo}
                    description="Semestres ativos ficam disponiveis no planejamento do cronograma."
                  />
                  <InlineMessage message={semesterMessage} />
                  <SmallSubmit submitting={submittingSemester} label="Cadastrar semestre" />
                </form>
                <EditableSection
                  title={`Semestres de ${selectedCurso?.nome ?? 'curso selecionado'}`}
                  emptyMessage="Nenhum semestre cadastrado para este curso."
                >
                  {courseSemestersForSelectedCourse.map((courseSemester) => (
                    <EditableItem
                      key={courseSemester.id}
                      title={courseSemester.nome ?? getSemesterLabel(courseSemester.numero)}
                      subtitle={`${getSemesterLabel(courseSemester.numero)} · ${courseSemester.ativo ? 'Ativo' : 'Inativo'}`}
                      editing={editingSemesterId === courseSemester.id}
                      saving={savingSemesterId === courseSemester.id}
                      deleting={deletingKey === `curso_semestres:${courseSemester.id}`}
                      onEdit={() => startSemesterEdit(courseSemester)}
                      onCancel={() => setEditingSemesterId(null)}
                      onSave={() => handleUpdateSemester(courseSemester.id)}
                      onDelete={() => handleDeleteSemester(courseSemester.id)}
                    >
                      {editingSemesterId === courseSemester.id ? (
                        <div className="grid gap-3">
                          <div className="grid gap-3 md:grid-cols-2">
                            <AdminInput
                              label="Numero"
                              value={editSemesterNumero}
                              onChange={setEditSemesterNumero}
                              type="number"
                              placeholder="1"
                            />
                            <AdminInput
                              label="Nome interno"
                              value={editSemesterNome}
                              onChange={setEditSemesterNome}
                              placeholder="Turma A / Entrada 2026"
                            />
                          </div>
                          <AdminToggle
                            label="Semestre ativo"
                            checked={editSemesterAtivo}
                            onChange={setEditSemesterAtivo}
                            description="Desative para ocultar este semestre do seletor de planejamento."
                          />
                        </div>
                      ) : null}
                    </EditableItem>
                  ))}
                </EditableSection>
                </>
                ) : null}

                {activeSupportSection === 'disciplinas' ? (
                <>
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
                </>
                ) : null}

                {activeSupportSection === 'professores' ? (
                <>
                <form onSubmit={handleCreateProfessor} className="space-y-3 rounded-[24px] border border-[#ececf1] bg-white p-4">
                  <p className="text-sm font-semibold text-[#16161a]">Novo professor</p>
                  <AdminInput
                    label="Nome"
                    value={novoProfessorNome}
                    onChange={setNovoProfessorNome}
                    placeholder="Prof. Andre Campos"
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
                        <div className="grid gap-3 md:grid-cols-2">
                          <AdminInput label="Nome" value={editProfessorNome} onChange={setEditProfessorNome} placeholder="Nome do professor" />
                          <AdminInput label="Especialidade" value={editProfessorEspecialidade} onChange={setEditProfessorEspecialidade} placeholder="Especialidade" />
                        </div>
                      ) : null}
                    </EditableItem>
                  ))}
                </EditableSection>
                </>
                ) : null}

                {activeSupportSection === 'eventos' ? (
                <>
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
                </>
                ) : null}
              </div>
            </section>
            ) : null}
          </div>

          {activeView !== 'apoio' ? (
          <div className="space-y-4">
            {(activeView === 'visao' || activeView === 'calendario' || activeView === 'disciplinas') ? (
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
            ) : null}

            {(activeView === 'visao' || activeView === 'disciplinas') ? (
            <section className="rounded-[28px] border border-[#ececf1] bg-[#f7f7fa] p-5">
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#16161a]">
                Progresso por disciplina do curso
              </h2>
              <p className="mt-2 text-sm text-[#6b6b74]">
                {selectedCurso
                  ? `Leitura das disciplinas vinculadas a ${selectedCurso.nome}.`
                  : 'Selecione um curso para acompanhar o andamento das disciplinas.'}
              </p>
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
            ) : null}

            {(activeView === 'visao' || activeView === 'calendario') ? (
            <section className="rounded-[28px] border border-[#ececf1] bg-[#f7f7fa] p-5">
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#16161a]">
                Visao por semestre
              </h2>
              <p className="mt-2 text-sm text-[#6b6b74]">
                {selectedCurso
                  ? `Distribuicao de carga planejada por semestre em ${selectedCurso.nome}.`
                  : 'Selecione um curso para acompanhar a distribuicao por semestre.'}
              </p>
              <div className="mt-4 space-y-3">
                {semesterProgressCards.length ? (
                  semesterProgressCards.map(({ courseSemester, progress }) => (
                    <div key={courseSemester.id} className="rounded-[22px] bg-white px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-[#16161a]">
                            {courseSemester.nome ?? getSemesterLabel(courseSemester.numero)}
                          </p>
                          <p className="mt-1 text-xs text-[#7a7a84]">
                            {progress.totalPlanejado}h planejadas de {progress.totalPrevisto}h previstas
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
                      <div className="mt-3 grid gap-3 md:grid-cols-3">
                        <MetricPill label="Planejada" value={`${progress.totalPlanejado}h`} />
                        <MetricPill label="Pendente" value={`${progress.pendente}h`} />
                        <MetricPill label="Modulos" value={String(progress.modulos)} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[22px] bg-white px-4 py-4 text-sm text-[#7a7a84]">
                    Cadastre semestres para o curso e distribua os modulos para acompanhar a carga por etapa.
                  </div>
                )}
              </div>
            </section>
            ) : null}

            {activeView === 'visao' ? (
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
            ) : null}

            {(activeView === 'visao' || activeView === 'calendario') ? (
            <section className="rounded-[28px] border border-[#ececf1] bg-[#f7f7fa] p-5">
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#16161a]">
                Calendario do curso
              </h2>
              <p className="mt-2 text-sm text-[#6b6b74]">
                {selectedCurso
                  ? `Linha do tempo recente de ${selectedCurso.nome}.`
                  : 'Selecione um curso para visualizar o calendario recente.'}
              </p>
              <div className="mt-4 space-y-3">
                {currentCourseCards.slice(0, 6).map((card) => (
                  <div key={card.id} className="rounded-[22px] bg-white px-4 py-4">
                    <p className="text-sm font-medium text-[#16161a]">{card.disciplinaNome}</p>
                    <p className="mt-1 text-xs text-[#7a7a84]">
                      {getSemesterLabel(card.semestre)} · {formatDateRange(card.dataInicio, card.dataFim)}
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
                {!currentCourseCards.length ? (
                  <div className="rounded-[22px] bg-white px-4 py-4 text-sm text-[#7a7a84]">
                    Nenhum modulo associado ao curso selecionado ate o momento.
                  </div>
                ) : null}
              </div>
            </section>
            ) : null}
          </div>
          ) : null}
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

function AdminViewButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
        active
          ? 'bg-[#163b65] text-white shadow-[0_12px_24px_rgba(22,59,101,0.18)]'
          : 'bg-[#f4f6f8] text-[#46505c] hover:bg-[#ecf0f4]'
      }`}
    >
      {label}
    </button>
  );
}

function AdminSubViewButton({
  active,
  label,
  onClick,
  value,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  value: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-4 py-3 text-left transition ${
        active
          ? 'border-[#163b65] bg-[#edf4fb] text-[#163b65]'
          : 'border-[#e5e5ec] bg-white text-[#46505c] hover:bg-[#f8fafc]'
      }`}
    >
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-1 text-xs opacity-75">{value} registros</p>
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
