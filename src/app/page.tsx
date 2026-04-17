'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cloud,
  GitBranch,
  Lock,
  Plus,
  ShieldCheck,
  Users,
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

const operationCards = [
  {
    icon: <CalendarDays className="h-4 w-4" />,
    title: 'Calendario modular',
    text: 'Organize modulos semanais com inicio, fim, sala, carga horaria e validacao de conflito.',
  },
  {
    icon: <Users className="h-4 w-4" />,
    title: 'Base academica',
    text: 'Centralize cursos, disciplinas e professores em um unico fluxo administrativo.',
  },
  {
    icon: <GitBranch className="h-4 w-4" />,
    title: 'Intercursos',
    text: 'Compartilhe um mesmo modulo entre cursos sem duplicar cadastro nem perder rastreabilidade.',
  },
];

const platformChips = [
  { icon: <Cloud className="h-3.5 w-3.5" />, label: 'Supabase' },
  { icon: <GitBranch className="h-3.5 w-3.5" />, label: 'GitHub' },
  { icon: <ShieldCheck className="h-3.5 w-3.5" />, label: 'Vercel' },
];

export default function Home() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [eventos, setEventos] = useState<EventoFeriado[]>([]);
  const [modulos, setModulos] = useState<CronogramaModulo[]>([]);
  const [intercursos, setIntercursos] = useState<Intercurso[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [dataSource, setDataSource] = useState<'mock' | 'supabase'>('mock');
  const [loadMessage, setLoadMessage] = useState(
    'Conecte o Supabase para substituir o modo de exemplo pelos dados reais da FCARP.'
  );

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
      setDataSource(result.source);
      setLoadMessage(result.message);
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

  const stats = useMemo(
    () => [
      { label: 'Cursos ativos', value: String(cursos.length || 0) },
      { label: 'Disciplinas base', value: String(disciplinas.length || 0) },
      { label: 'Bloqueios cadastrados', value: String(eventos.length || 0) },
    ],
    [cursos.length, disciplinas.length, eventos.length]
  );

  const adminHighlights = useMemo(
    () => [
      `${modulos.length} modulos cadastrados no calendario`,
      `${professores.length} professores disponiveis para alocacao`,
      `${intercursos.length} relacoes intercursos registradas`,
    ],
    [modulos.length, professores.length, intercursos.length]
  );

  return (
    <main className="min-h-screen bg-[#edf1f5] px-4 py-6 text-[#171717] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1280px] rounded-[32px] border border-white/80 bg-[#fcfcfd] shadow-[0_30px_90px_rgba(132,146,166,0.22)]">
        <BrowserChrome />
        <section className="overflow-hidden rounded-b-[32px]">
          <div className="relative">
            <GridBackdrop />
            <Header />

            <section className="relative z-10 px-5 pb-8 pt-12 text-center sm:px-8 md:pt-16 lg:px-12 lg:pb-12">
              <div className="mx-auto flex w-fit items-center gap-3 rounded-full border border-[#ececf1] bg-white/90 px-4 py-2 text-xs text-[#5d5d66] shadow-[0_6px_18px_rgba(17,17,20,0.04)]">
                <span className="rounded-full bg-[#111111] px-2 py-0.5 text-[10px] font-semibold text-white">
                  FCARP DOC
                </span>
                <span>Gestao do calendario academico modular</span>
              </div>

              <div className="mx-auto mt-8 max-w-[780px]">
                <h1 className="text-[42px] font-semibold leading-[0.98] tracking-[-0.06em] text-[#121216] sm:text-[56px] lg:text-[72px]">
                  Plataforma para organizar
                  <br />
                  cursos, modulos e intercursos
                </h1>
                <p className="mx-auto mt-6 max-w-[700px] text-base leading-7 text-[#666672] sm:text-lg">
                  A FCARP passa a controlar sua operacao academica em um painel unico:
                  cadastros base, semanas bloqueadas, cronograma semanal, consulta publica
                  por curso e acompanhamento de carga horaria em tempo real.
                </p>
              </div>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/consulta"
                  className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#5b61ff,#6b36ff)] px-6 py-3 text-sm font-medium text-white shadow-[0_12px_28px_rgba(91,97,255,0.35)] transition hover:translate-y-[-1px]"
                >
                  Abrir consulta publica
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/admin/login"
                  className="inline-flex items-center gap-2 rounded-full border border-[#ebebf0] bg-white px-6 py-3 text-sm font-medium text-[#171717] shadow-[0_8px_20px_rgba(20,20,23,0.05)]"
                >
                  Entrar no painel admin
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                {platformChips.map((chip) => (
                  <span
                    key={chip.label}
                    className="inline-flex items-center gap-2 rounded-full border border-[#ececf1] bg-white/90 px-3 py-2 text-xs font-medium text-[#5d5d66]"
                  >
                    {chip.icon}
                    {chip.label}
                  </span>
                ))}
              </div>

              <div className="mx-auto mt-12 grid max-w-[680px] grid-cols-1 gap-3 sm:grid-cols-3">
                {stats.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[24px] border border-[#efeff3] bg-white/70 px-5 py-4 backdrop-blur"
                  >
                    <div className="text-[28px] font-semibold tracking-[-0.05em] text-[#141419]">
                      {item.value}
                    </div>
                    <div className="mt-1 text-sm text-[#6a6a74]">{item.label}</div>
                  </div>
                ))}
              </div>

              <div className="mx-auto mt-5 grid max-w-[920px] grid-cols-1 gap-3 md:grid-cols-3">
                {operationCards.map((card) => (
                  <div
                    key={card.title}
                    className="rounded-[24px] border border-[#efeff3] bg-white/72 px-5 py-4 text-left backdrop-blur"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#f4f4ff] text-[#5b61ff]">
                      {card.icon}
                    </div>
                    <p className="mt-4 text-base font-semibold tracking-[-0.03em] text-[#16161a]">
                      {card.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#6a6a74]">{card.text}</p>
                  </div>
                ))}
              </div>

              <div className="mx-auto mt-6 max-w-[1020px] rounded-[28px] border border-[#ececf1] bg-white/82 p-4 text-left shadow-[0_12px_30px_rgba(17,17,20,0.04)] backdrop-blur sm:p-5">
                <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
                  <div className="rounded-[24px] bg-[#f7f7fa] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-[#7a7a84]">
                          Operacao academica
                        </p>
                        <p className="mt-1 text-lg font-semibold tracking-[-0.03em] text-[#16161a]">
                          Visao geral do ambiente
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          dataSource === 'supabase'
                            ? 'bg-[#e8fff0] text-[#147a46]'
                            : 'bg-[#fff5e8] text-[#9a5b00]'
                        }`}
                      >
                        {dataSource === 'supabase' ? 'Supabase live' : 'Mock local'}
                      </span>
                    </div>

                    <div className="mt-4 rounded-[22px] border border-[#ebebf0] bg-white px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-[#7a7a84]">
                        Status atual
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#6b6b74]">{loadMessage}</p>
                    </div>

                    <div className="mt-4 rounded-[22px] border border-[#ebebf0] bg-white px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-[#7a7a84]">
                        Destaques do admin
                      </p>
                      <div className="mt-3 space-y-3">
                        {adminHighlights.map((item) => (
                          <div key={item} className="flex items-start gap-3 text-sm text-[#5d5d66]">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#5b61ff]" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 rounded-[22px] border border-[#ebebf0] bg-white px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-[#7a7a84]">
                        Acoes principais
                      </p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <Link
                          href="/admin/login"
                          className="rounded-2xl border border-[#e7e7ee] bg-[#fafaff] px-4 py-3 text-sm font-medium text-[#171717]"
                        >
                          Entrar para cadastrar bases
                        </Link>
                        <Link
                          href="/consulta"
                          className="rounded-2xl border border-[#e7e7ee] bg-white px-4 py-3 text-sm font-medium text-[#171717]"
                        >
                          Ver o cronograma publico
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] bg-[linear-gradient(135deg,#111827,#1f2937)] p-4 text-white">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-white/55">
                          Consulta por curso
                        </p>
                        <p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                          Proxima janela academica
                        </p>
                      </div>

                      <label className="block w-full md:max-w-[280px]">
                        <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">
                          Curso
                        </span>
                        <select
                          value={selectedCourseId}
                          onChange={(event) => setSelectedCourseId(event.target.value)}
                          className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-white outline-none"
                        >
                          {cursos.map((curso) => (
                            <option key={curso.id} value={curso.id} className="text-black">
                              {curso.nome}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-[1.05fr_0.95fr]">
                      <div className="space-y-3">
                        <div className="rounded-[22px] border border-white/10 bg-white/6 px-4 py-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-white/50">
                            Intervalo observado
                          </p>
                          <p className="mt-2 text-sm text-white/80">
                            {nextWeek.start.toLocaleDateString('pt-BR')} ate{' '}
                            {nextWeek.end.toLocaleDateString('pt-BR')}
                          </p>
                          {selectedProgress ? (
                            <>
                              <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                                <span className="text-white/72">
                                  {selectedProgress.totalAgendado}h de{' '}
                                  {selectedProgress.totalCurso}h planejadas
                                </span>
                                <span className="font-semibold text-white">
                                  {selectedProgress.percentual}%
                                </span>
                              </div>
                              <div className="mt-3 h-2 rounded-full bg-white/10">
                                <div
                                  className="h-2 rounded-full bg-[linear-gradient(90deg,#6d7cff,#82b3ff)]"
                                  style={{ width: `${selectedProgress.percentual}%` }}
                                />
                              </div>
                            </>
                          ) : null}
                        </div>

                        {upcomingCards.length > 0 ? (
                          upcomingCards.map((card) => (
                            <article
                              key={card.id}
                              className="rounded-[22px] border border-white/10 bg-white/8 px-4 py-4"
                            >
                              <p className="text-lg font-semibold">{card.disciplinaNome}</p>
                              <p className="mt-2 text-sm text-white/70">
                                {formatDateRange(card.dataInicio, card.dataFim)} -{' '}
                                {card.cargaHorariaSemanal}h
                              </p>
                              <p className="mt-2 text-sm text-white/78">
                                {card.professorNome ?? 'Professor nao definido'}
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
                            </article>
                          ))
                        ) : (
                          <div className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-5 text-sm text-white/70">
                            Nenhum modulo encontrado para a proxima semana no curso selecionado.
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-white/50">
                            Bloqueios da semana
                          </p>
                          {nextBlockers.length > 0 ? (
                            <div className="mt-3 space-y-2">
                              {nextBlockers.map((item) => (
                                <div
                                  key={item.id}
                                  className="rounded-2xl border border-white/8 bg-white/6 px-3 py-3 text-sm text-white/78"
                                >
                                  <div className="font-medium text-white">{item.nome}</div>
                                  <div className="mt-1 text-white/60">
                                    {item.data} - {item.tipo}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-3 text-sm text-white/68">
                              Nao ha feriados ou eventos bloqueando a proxima janela letiva.
                            </p>
                          )}
                        </div>

                        <div className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-white/50">
                            Fluxo do projeto
                          </p>
                          <div className="mt-3 space-y-3 text-sm text-white/72">
                            <p>1. Cadastre cursos, professores, disciplinas e bloqueios.</p>
                            <p>2. Monte modulos semanais e vincule um ou mais cursos.</p>
                            <p>3. Publique a consulta para alunos e equipe academica.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
          <span>fcarp-doc.vercel.app</span>
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
        <div>
          <p className="text-[26px] font-semibold tracking-[-0.04em] text-[#121216]">
            FCARP DOC
          </p>
        </div>
      </div>

      <nav className="hidden items-center gap-10 text-sm text-[#54545c] lg:flex">
        <a href="/consulta" className="transition hover:text-black">
          Painel publico
        </a>
        <a href="/admin/login" className="transition hover:text-black">
          Login
        </a>
      </nav>

      <div className="flex items-center gap-3">
        <span className="hidden text-sm font-medium text-[#171717] sm:inline-flex">
          VS Code + GitHub + Vercel
        </span>
        <Link
          href="/admin/login"
          className="inline-flex items-center gap-2 rounded-full border border-[#e9e9ef] bg-white px-4 py-2.5 text-sm font-medium text-[#171717] shadow-[0_8px_20px_rgba(20,20,23,0.05)] transition hover:shadow-[0_10px_28px_rgba(20,20,23,0.08)]"
        >
          Abrir painel
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </header>
  );
}

function GridBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(233,233,239,0.92)_1px,transparent_1px),linear-gradient(to_bottom,rgba(233,233,239,0.92)_1px,transparent_1px)] bg-[size:33.333%_100%,100%_33.333%]" />
      <div className="absolute left-[27%] top-[23%] h-2.5 w-2.5 rounded-full bg-[#2C6E91]" />
      <div className="absolute left-[73%] top-[23%] h-2.5 w-2.5 rounded-full bg-[#163B65]" />
      <div className="absolute left-[27%] top-[43%] h-2.5 w-2.5 rounded-full bg-[#89A7C2]" />
      <div className="absolute left-[73%] top-[43%] h-2.5 w-2.5 rounded-full bg-[#7D8B99]" />
      <div className="absolute left-[27%] top-[64%] h-2.5 w-2.5 rounded-full bg-[#2C6E91]" />
      <div className="absolute left-[73%] top-[64%] h-2.5 w-2.5 rounded-full bg-[#163B65]" />
      <div className="absolute inset-x-0 top-0 h-32 bg-[linear-gradient(180deg,rgba(252,252,253,0.8),transparent)]" />
    </div>
  );
}
