'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Lock,
  Plus,
} from 'lucide-react';
import { loadPlatformData } from '@/lib/unisched-repository';
import {
  formatDateRange,
  getCourseProgress,
  getNextWeekRange,
  getUpcomingModulesForCourse,
  type CronogramaModulo,
  type Curso,
  type Disciplina,
  type EventoFeriado,
  type Intercurso,
  type Professor,
} from '@/lib/unisched-data';

export default function Home() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [eventos, setEventos] = useState<EventoFeriado[]>([]);
  const [modulos, setModulos] = useState<CronogramaModulo[]>([]);
  const [intercursos, setIntercursos] = useState<Intercurso[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const result = await loadPlatformData();

      if (!isMounted) {
        return;
      }

      setCursos(result.cursos);
      setProfessores(result.professores);
      setDisciplinas(result.disciplinas);
      setEventos(result.eventosFeriados);
      setModulos(result.cronogramaModulos);
      setIntercursos(result.intercursos);
      setSelectedCourseId(result.cursos[0]?.id ?? '');
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const nextWeek = getNextWeekRange();
  const selectedCourse =
    cursos.find((curso) => curso.id === selectedCourseId) ?? cursos[0] ?? null;

  const upcomingCards = selectedCourse
    ? getUpcomingModulesForCourse(
        selectedCourse.id,
        cursos,
        disciplinas,
        professores,
        modulos,
        intercursos
      )
    : [];

  const selectedProgress = selectedCourse
    ? getCourseProgress(selectedCourse, modulos, intercursos)
    : null;

  const nextBlockers = eventos.filter((evento) => {
    const eventTime = new Date(evento.data).getTime();
    return (
      eventTime >= nextWeek.start.getTime() && eventTime <= nextWeek.end.getTime()
    );
  });

  const overviewStats = useMemo(
    () => [
      {
        label: 'Cursos',
        value: String(cursos.length || 0),
      },
      {
        label: 'Modulos',
        value: String(modulos.length || 0),
      },
      {
        label: 'Professores',
        value: String(professores.length || 0),
      },
    ],
    [cursos.length, modulos.length, professores.length]
  );

  return (
    <main className="min-h-screen bg-[#edf1f5] px-4 py-6 text-[#171717] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1240px] rounded-[32px] border border-white/80 bg-[#fcfcfd] shadow-[0_30px_90px_rgba(132,146,166,0.22)]">
        <BrowserChrome />
        <section className="relative overflow-hidden rounded-b-[32px]">
          <GridBackdrop />
          <Header />

          <div className="relative z-10 px-5 pb-8 pt-8 sm:px-8 lg:px-12 lg:pb-12">
            <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
              <div className="max-w-[720px]">
                <span className="inline-flex items-center rounded-full border border-[#ececf1] bg-white/90 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-[#62626c] shadow-[0_6px_18px_rgba(17,17,20,0.04)]">
                  FCARP DOC
                </span>

                <h1 className="mt-6 text-[42px] font-semibold leading-[0.96] tracking-[-0.06em] text-[#121216] sm:text-[56px] lg:text-[68px]">
                  Calendario academico
                  <br />
                  modular, limpo e direto
                </h1>

                <p className="mt-5 max-w-[620px] text-base leading-7 text-[#666672] sm:text-lg">
                  Consulte a proxima semana letiva, acompanhe a carga horaria do
                  curso e acesse o painel administrativo sem excesso de informacao na
                  tela inicial.
                </p>

                <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row">
                  <Link
                    href="/consulta"
                    className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#163B65,#2C6E91)] px-6 py-3 text-sm font-medium text-white shadow-[0_16px_32px_rgba(22,59,101,0.28)] transition hover:translate-y-[-1px]"
                  >
                    Abrir consulta
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/admin/login"
                    className="inline-flex items-center gap-2 rounded-full border border-[#e8e8ee] bg-white px-6 py-3 text-sm font-medium text-[#171717] shadow-[0_8px_20px_rgba(20,20,23,0.05)]"
                  >
                    Entrar no admin
                  </Link>
                </div>

                <div className="mt-8 grid max-w-[520px] grid-cols-3 gap-3">
                  {overviewStats.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-[22px] border border-[#ededf2] bg-white/82 px-4 py-4 backdrop-blur"
                    >
                      <div className="text-[26px] font-semibold tracking-[-0.05em] text-[#141419]">
                        {item.value}
                      </div>
                      <div className="mt-1 text-sm text-[#6a6a74]">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="rounded-[30px] border border-[#ececf1] bg-white/82 p-4 shadow-[0_16px_36px_rgba(17,17,20,0.05)] backdrop-blur sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#7a7a84]">
                      Proxima semana
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#16161a]">
                      Visao rapida por curso
                    </h2>
                  </div>
                  <div className="rounded-full bg-[#f3f5f8] px-3 py-1 text-xs font-medium text-[#4f5662]">
                    {nextWeek.start.toLocaleDateString('pt-BR')} ate{' '}
                    {nextWeek.end.toLocaleDateString('pt-BR')}
                  </div>
                </div>

                <div className="mt-5">
                  <label className="block">
                    <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-[#7a7a84]">
                      Curso
                    </span>
                    <select
                      value={selectedCourseId}
                      onChange={(event) => setSelectedCourseId(event.target.value)}
                      className="w-full rounded-2xl border border-[#e5e5ec] bg-[#fbfbfd] px-4 py-3 text-sm text-[#171717] outline-none transition focus:border-[#163B65]"
                    >
                      {cursos.map((curso) => (
                        <option key={curso.id} value={curso.id}>
                          {curso.nome}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {selectedProgress ? (
                  <div className="mt-4 rounded-[24px] bg-[#f6f8fb] px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-[#16161a]">
                          Carga horaria planejada
                        </p>
                        <p className="mt-1 text-sm text-[#6b6b74]">
                          {selectedProgress.totalAgendado}h de{' '}
                          {selectedProgress.totalCurso}h
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-[#163B65]">
                        {selectedProgress.percentual}%
                      </span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-[#e1e7ef]">
                      <div
                        className="h-2 rounded-full bg-[linear-gradient(90deg,#163B65,#2C6E91)]"
                        style={{ width: `${selectedProgress.percentual}%` }}
                      />
                    </div>
                  </div>
                ) : null}

                <div className="mt-4 space-y-3">
                  {upcomingCards.length > 0 ? (
                    upcomingCards.slice(0, 2).map((card) => (
                      <article
                        key={card.id}
                        className="rounded-[24px] border border-[#ececf1] bg-white px-4 py-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-base font-semibold tracking-[-0.03em] text-[#16161a]">
                              {card.disciplinaNome}
                            </p>
                            <p className="mt-1 text-sm text-[#6b6b74]">
                              {formatDateRange(card.dataInicio, card.dataFim)}
                            </p>
                          </div>
                          <div className="inline-flex items-center gap-1 rounded-full bg-[#edf3f8] px-3 py-1 text-xs font-medium text-[#315878]">
                            <Clock3 className="h-3.5 w-3.5" />
                            {card.cargaHorariaSemanal}h
                          </div>
                        </div>

                        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#f5f7fa] px-3 py-1 text-xs text-[#5b6470]">
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#163B65]" />
                          {card.professorNome ?? 'Professor a definir'}
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-[24px] border border-[#ececf1] bg-white px-4 py-5 text-sm text-[#6b6b74]">
                      Nenhum modulo previsto para a proxima semana no curso selecionado.
                    </div>
                  )}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[24px] bg-[#121922] px-4 py-4 text-white">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/50">
                      Bloqueios
                    </p>
                    <p className="mt-2 text-3xl font-semibold tracking-[-0.05em]">
                      {nextBlockers.length}
                    </p>
                    <p className="mt-2 text-sm text-white/68">
                      eventos ou feriados na proxima janela letiva
                    </p>
                  </div>

                  <div className="rounded-[24px] bg-[#f7f7fa] px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#7a7a84]">
                      Acesso rapido
                    </p>
                    <div className="mt-3 space-y-2">
                      <Link
                        href="/consulta"
                        className="block rounded-2xl border border-[#e6e7ed] bg-white px-4 py-3 text-sm font-medium text-[#171717]"
                      >
                        Consulta publica
                      </Link>
                      <Link
                        href="/admin/login"
                        className="block rounded-2xl border border-[#e6e7ed] bg-white px-4 py-3 text-sm font-medium text-[#171717]"
                      >
                        Painel administrativo
                      </Link>
                    </div>
                  </div>
                </div>
              </aside>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function BrowserChrome() {
  return (
    <div className="flex items-center justify-between border-b border-[#ececf1] px-4 py-3 sm:px-6">
      <div className="flex items-center gap-3">
        <div className="flex gap-2">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="hidden items-center gap-2 text-[#8e8e98] sm:flex">
          <ChevronLeft className="h-4 w-4" />
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>

      <div className="mx-4 hidden flex-1 items-center justify-center md:flex">
        <div className="flex w-full max-w-[520px] items-center justify-center gap-2 rounded-full border border-[#ececf1] bg-[#f7f7fa] px-4 py-2 text-xs text-[#6f6f78]">
          <Lock className="h-3.5 w-3.5" />
          <span>web-fcarp.vercel.app</span>
        </div>
      </div>

      <div className="flex items-center gap-3 text-[#6f6f78]">
        <Plus className="h-4 w-4" />
        <div className="h-4 w-4 rounded-[4px] border border-current" />
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#163B65,#2C6E91)] text-white shadow-[0_10px_30px_rgba(22,59,101,0.25)]">
          <CalendarDays className="h-5 w-5" />
        </div>
        <p className="text-[26px] font-semibold tracking-[-0.04em] text-[#121216]">
          FCARP DOC
        </p>
      </div>

      <nav className="hidden items-center gap-10 text-sm text-[#54545c] lg:flex">
        <Link href="/consulta" className="transition hover:text-black">
          Consulta
        </Link>
        <Link href="/admin/login" className="transition hover:text-black">
          Admin
        </Link>
      </nav>
    </header>
  );
}

function GridBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(233,233,239,0.92)_1px,transparent_1px),linear-gradient(to_bottom,rgba(233,233,239,0.92)_1px,transparent_1px)] bg-[size:33.333%_100%,100%_33.333%]" />
      <div className="absolute inset-x-0 top-0 h-32 bg-[linear-gradient(180deg,rgba(252,252,253,0.8),transparent)]" />
      <div className="absolute left-[18%] top-[24%] h-24 w-24 rounded-full bg-[#d9e8f2]/80 blur-2xl" />
      <div className="absolute right-[10%] top-[16%] h-36 w-36 rounded-full bg-[#dbe1ff]/70 blur-3xl" />
      <div className="absolute bottom-[8%] left-[48%] h-28 w-28 rounded-full bg-[#e8eef4]/90 blur-2xl" />
    </div>
  );
}
