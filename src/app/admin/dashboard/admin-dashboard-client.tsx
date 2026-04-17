'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Check,
  GitBranch,
  GraduationCap,
  LogOut,
  Plus,
  Users,
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import { loadPlatformData } from '@/lib/unisched-repository';
import {
  addDays,
  buildCronogramaCards,
  formatDateRange,
  getCourseProgress,
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

  const [novoCursoNome, setNovoCursoNome] = useState('');
  const [novoCursoCarga, setNovoCursoCarga] = useState('360');
  const [novoCursoCor, setNovoCursoCor] = useState('#163B65');

  const [novoProfessorNome, setNovoProfessorNome] = useState('');
  const [novoProfessorCidade, setNovoProfessorCidade] = useState('');
  const [novoProfessorEspecialidade, setNovoProfessorEspecialidade] = useState('');

  const [novaDisciplinaNome, setNovaDisciplinaNome] = useState('');

  const [novoEventoNome, setNovoEventoNome] = useState('');
  const [novoEventoData, setNovoEventoData] = useState('');
  const [novoEventoTipo, setNovoEventoTipo] = useState<'feriado' | 'evento'>(
    'evento'
  );

  const [disciplinaId, setDisciplinaId] = useState('');
  const [professorId, setProfessorId] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [cargaHorariaSemanal, setCargaHorariaSemanal] = useState('20');
  const [sala, setSala] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);

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

  const progressCards = useMemo(
    () =>
      cursos.map((curso) => ({
        curso,
        progress: getCourseProgress(curso, modulos, intercursos),
      })),
    [cursos, modulos, intercursos]
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
      setProfessores(platformData.professores);
      setDisciplinas(platformData.disciplinas);
      setEventos(platformData.eventosFeriados);
      setModulos(platformData.cronogramaModulos);
      setIntercursos(platformData.intercursos);
      setStatusMessage(platformData.message);

      if (!selectedCourseIds.length && platformData.cursos.length > 0) {
        setSelectedCourseIds([platformData.cursos[0].id]);
      }

      if (!disciplinaId && platformData.disciplinas.length > 0) {
        setDisciplinaId(platformData.disciplinas[0].id);
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
  }, [router, userEmail, dataInicio, disciplinaId, professorId, selectedCourseIds.length]);

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

    setSubmittingDisciplina(true);
    setDisciplinaMessage('Salvando disciplina...');
    const { error } = await supabase.from('disciplinas').insert({
      nome: novaDisciplinaNome.trim(),
    });

    if (error) {
      setSubmittingDisciplina(false);
      setDisciplinaMessage(formatRequestMessage(error.message));
      return;
    }

    setNovaDisciplinaNome('');
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

    if (!selectedCourseIds.length) {
      setStatusMessage('Selecione pelo menos um curso participante.');
      return;
    }

    const inicio = new Date(`${dataInicio}T00:00:00`);
    const fim = addDays(inicio, 4);
    const dataFim = fim.toISOString().slice(0, 10);

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
        .filter((item) => selectedCourseIds.includes(item.cursoId))
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
        disciplina_id: disciplinaId,
        professor_id: professorId || null,
        data_inicio: dataInicio,
        data_fim: dataFim,
        carga_horaria_semanal: Number(cargaHorariaSemanal),
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
      selectedCourseIds.map((cursoId) => ({
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
    setCargaHorariaSemanal('20');
    setSala('');
    setObservacoes('');
    await reloadPlatformData();
    setSubmittingModulo(false);
    setStatusMessage('Modulo criado com validacao de conflitos e vinculado aos cursos selecionados.');
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
                  label="Disciplina"
                  value={disciplinaId}
                  onChange={setDisciplinaId}
                  options={disciplinas.map((item) => ({ label: item.nome, value: item.id }))}
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
                  onChange={setDataInicio}
                  type="date"
                  placeholder=""
                />
                <AdminInput
                  label="Carga horaria semanal"
                  value={cargaHorariaSemanal}
                  onChange={setCargaHorariaSemanal}
                  type="number"
                  placeholder="20"
                />
                <AdminInput
                  label="Sala"
                  value={sala}
                  onChange={setSala}
                  placeholder="Sala 204"
                />
                <AdminInput
                  label="Fim calculado"
                  value={
                    dataInicio
                      ? addDays(new Date(`${dataInicio}T00:00:00`), 4)
                          .toISOString()
                          .slice(0, 10)
                      : ''
                  }
                  onChange={() => {}}
                  type="date"
                  placeholder=""
                  readOnly
                />
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
                    {cursos.map((curso) => (
                      <label
                        key={curso.id}
                        className="flex items-center gap-3 rounded-2xl border border-[#e5e5ec] bg-white px-4 py-3"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCourseIds.includes(curso.id)}
                          onChange={() => toggleCourse(curso.id)}
                        />
                        <span className="text-sm text-[#171717]">{curso.nome}</span>
                      </label>
                    ))}
                  </div>
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

              <div className="mt-5 grid gap-4 md:grid-cols-2">
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

                <form onSubmit={handleCreateDisciplina} className="space-y-3 rounded-[24px] border border-[#ececf1] bg-white p-4">
                  <p className="text-sm font-semibold text-[#16161a]">Nova disciplina</p>
                  <AdminInput
                    label="Nome"
                    value={novaDisciplinaNome}
                    onChange={setNovaDisciplinaNome}
                    placeholder="Analise e Projeto de Computadores"
                  />
                  <InlineMessage message={disciplinaMessage} />
                  <SmallSubmit submitting={submittingDisciplina} label="Cadastrar disciplina" />
                </form>

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
                Progresso de carga horaria
              </h2>
              <div className="mt-4 space-y-3">
                {progressCards.map(({ curso, progress }) => (
                  <div key={curso.id} className="rounded-[22px] bg-white px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-[#16161a]">{curso.nome}</p>
                        <p className="mt-1 text-xs text-[#7a7a84]">
                          {progress.totalAgendado}h de {progress.totalCurso}h
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
                  </div>
                ))}
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
