'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CirclePlay,
  Cloud,
  GitBranch,
  GraduationCap,
  Lock,
  Plus,
  Shield,
  Users,
} from 'lucide-react';
import {
  formatDateRange,
  getNextWeekRange,
  getUpcomingAllocationForCourse,
  type Allocation,
  type Course,
  type Professor,
} from '@/lib/unisched-data';
import { loadPublicScheduleData } from '@/lib/unisched-repository';

const kpis = [
  { label: 'Professores ativos', value: '126+' },
  { label: 'Turmas modulares', value: '32' },
  { label: 'Cidades atendidas', value: '18' },
];

const productFlows = [
  {
    icon: <Shield className="h-4 w-4" />,
    title: 'Area Admin',
    text: 'Login e senha com Supabase Auth para gerenciar cursos, professores, feriados e modulos.',
  },
  {
    icon: <Cloud className="h-4 w-4" />,
    title: 'Dados persistidos',
    text: 'Tudo cadastrado no painel salva no Supabase e abastece automaticamente a operacao academica.',
  },
  {
    icon: <CalendarDays className="h-4 w-4" />,
    title: 'Pagina publica',
    text: 'Aluno escolhe o curso e o sistema mostra sempre a proxima semana e a aula planejada.',
  },
];

const chartPointsBlue = [50, 165, 168, 255, 255, 215, 215, 188, 188, 162, 162];
const chartPointsAmber = [118, 118, 135, 135, 170, 170, 165, 95, 95, 125, 125];
const chartPointsGray = [130, 92, 92, 118, 118, 80, 80, 150, 150, 112, 112];

const topModules = [
  {
    title: 'Metodologias Ativas',
    score: '92.4%',
    detail: '84 alocacoes',
    progress: 'w-[86%]',
  },
  {
    title: 'Direito Digital',
    score: '88.1%',
    detail: '57 alocacoes',
    progress: 'w-[72%]',
  },
];

const integrationChips = [
  {
    icon: <Cloud className="h-3.5 w-3.5" />,
    label: 'Supabase ready',
  },
  {
    icon: <GitBranch className="h-3.5 w-3.5" />,
    label: 'GitHub flow',
  },
  {
    icon: <Shield className="h-3.5 w-3.5" />,
    label: 'Deploy na Vercel',
  },
];

export default function Home() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [dataSource, setDataSource] = useState<'mock' | 'supabase'>('mock');
  const [loadState, setLoadState] = useState<'loading' | 'ready'>('loading');
  const [loadMessage, setLoadMessage] = useState(
    'Configure o Supabase para trocar os dados de exemplo por dados reais.'
  );

  useEffect(() => {
    let isMounted = true;

    async function loadAcademicData() {
      const result = await loadPublicScheduleData();

      if (!isMounted) {
        return;
      }

      setCourses(result.courses);
      setProfessors(result.professors);
      setAllocations(result.allocations);
      setSelectedCourseId((current) => current || result.courses[0]?.id || '');
      setDataSource(result.source);
      setLoadState('ready');
      setLoadMessage(result.message);
    }

    void loadAcademicData();

    return () => {
      isMounted = false;
    };
  }, []);

  const nextWeek = getNextWeekRange();
  const selectedCourse =
    courses.find((course) => course.id === selectedCourseId) ?? courses[0] ?? null;
  const nextAllocation = selectedCourse
    ? getUpcomingAllocationForCourse(selectedCourse.id, allocations)
    : null;
  const nextProfessor = nextAllocation
    ? professors.find((professor) => professor.id === nextAllocation.professor_id) ?? null
    : null;

  return (
    <main className="min-h-screen bg-[#edf1f5] px-4 py-6 text-[#171717] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1280px] rounded-[32px] border border-white/80 bg-[#fcfcfd] shadow-[0_30px_90px_rgba(132,146,166,0.22)]">
        <BrowserChrome />
        <section className="overflow-hidden rounded-b-[32px]">
          <div className="relative">
            <GridBackdrop />
            <Header />
            <Hero
              courses={courses}
              selectedCourseId={selectedCourseId}
              onSelectCourse={setSelectedCourseId}
              dataSource={dataSource}
              loadState={loadState}
              loadMessage={loadMessage}
              nextAllocation={nextAllocation}
              nextProfessor={nextProfessor}
              nextWeek={nextWeek}
            />
            <AnalyticsRow />
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
          <span>flowmail-beconfidence.agency</span>
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
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#5b61ff,#6b36ff)] text-white shadow-[0_10px_30px_rgba(91,97,255,0.35)]">
          <CalendarDays className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[26px] font-semibold tracking-[-0.04em]">UniSched</p>
        </div>
      </div>

      <nav className="hidden items-center gap-10 text-sm text-[#54545c] lg:flex">
        <a href="#features" className="transition hover:text-black">
          Recursos
        </a>
        <a href="#analytics" className="transition hover:text-black">
          Analytics
        </a>
        <a href="#integrations" className="transition hover:text-black">
          Integracoes
        </a>
        <a href="#public" className="transition hover:text-black">
          Consulta publica
        </a>
      </nav>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="hidden text-sm font-medium text-[#171717] sm:inline-flex"
        >
          Admin
        </button>
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

function Hero({
  courses,
  selectedCourseId,
  onSelectCourse,
  dataSource,
  loadState,
  loadMessage,
  nextAllocation,
  nextProfessor,
  nextWeek,
}: {
  courses: Course[];
  selectedCourseId: string;
  onSelectCourse: (value: string) => void;
  dataSource: 'mock' | 'supabase';
  loadState: 'loading' | 'ready';
  loadMessage: string;
  nextAllocation: Allocation | null;
  nextProfessor: Professor | null;
  nextWeek: { start: Date; end: Date };
}) {
  const weekLabel = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  });

  return (
    <section className="relative z-10 px-5 pb-8 pt-12 text-center sm:px-8 md:pt-16 lg:px-12 lg:pb-12">
      <div className="mx-auto flex w-fit items-center gap-3 rounded-full border border-[#ececf1] bg-white/90 px-4 py-2 text-xs text-[#5d5d66] shadow-[0_6px_18px_rgba(17,17,20,0.04)]">
        <span className="rounded-full bg-[#111111] px-2 py-0.5 text-[10px] font-semibold text-white">
          10k+
        </span>
        <span>Fluxos academicos gerenciados por faculdades modulares</span>
      </div>

      <div className="mx-auto mt-8 max-w-[760px]">
        <h1 className="text-[42px] font-semibold leading-[0.98] tracking-[-0.06em] text-[#121216] sm:text-[56px] lg:text-[72px]">
          Organize Seus Modulos
          <br />
          Sem Perder Complexidade
        </h1>
        <p className="mx-auto mt-6 max-w-[620px] text-base leading-7 text-[#666672] sm:text-lg">
          Controle professores, blocos semanais, carga horaria, feriados,
          logistica e uma pagina publica que sempre entrega a proxima semana
          letiva, tudo conectado a Supabase, GitHub, Vercel e IA.
        </p>
      </div>

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/consulta"
          className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#5b61ff,#6b36ff)] px-6 py-3 text-sm font-medium text-white shadow-[0_12px_28px_rgba(91,97,255,0.35)] transition hover:translate-y-[-1px]"
        >
          Comecar agora
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/admin/login"
          className="inline-flex items-center gap-2 rounded-full border border-[#ebebf0] bg-white px-6 py-3 text-sm font-medium text-[#171717] shadow-[0_8px_20px_rgba(20,20,23,0.05)]"
        >
          <CirclePlay className="h-4 w-4 fill-current" />
          Abrir admin
        </Link>
      </div>

      <div
        id="integrations"
        className="mt-8 flex flex-wrap items-center justify-center gap-2"
      >
        {integrationChips.map((chip) => (
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
        {kpis.map((item) => (
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
        {productFlows.map((flow) => (
          <div
            key={flow.title}
            className="rounded-[24px] border border-[#efeff3] bg-white/72 px-5 py-4 text-left backdrop-blur"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#f4f4ff] text-[#5b61ff]">
              {flow.icon}
            </div>
            <p className="mt-4 text-base font-semibold tracking-[-0.03em] text-[#16161a]">
              {flow.title}
            </p>
            <p className="mt-2 text-sm leading-6 text-[#6a6a74]">{flow.text}</p>
          </div>
        ))}
      </div>

      <div
        id="public"
        className="mx-auto mt-6 max-w-[920px] rounded-[28px] border border-[#ececf1] bg-white/82 p-4 text-left shadow-[0_12px_30px_rgba(17,17,20,0.04)] backdrop-blur sm:p-5"
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-[24px] bg-[#f7f7fa] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#7a7a84]">
                  Consulta publica
                </p>
                <p className="mt-1 text-lg font-semibold tracking-[-0.03em] text-[#16161a]">
                  Proxima semana por curso
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

            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-medium text-[#4f4f59]">
                Selecione o curso
              </span>
              <select
                value={selectedCourseId}
                onChange={(event) => onSelectCourse(event.target.value)}
                className="w-full rounded-2xl border border-[#e5e5ec] bg-white px-4 py-3 text-sm text-[#171717] outline-none transition focus:border-[#5b61ff]"
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-4 rounded-[22px] border border-[#ebebf0] bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-[#7a7a84]">
                Janela consultada
              </p>
              <p className="mt-2 text-sm font-medium text-[#16161a]">
                {weekLabel.format(nextWeek.start)} - {weekLabel.format(nextWeek.end)}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#6b6b74]">{loadMessage}</p>
            </div>
          </div>

          <div className="rounded-[24px] bg-[linear-gradient(135deg,#111827,#1f2937)] p-4 text-white">
            <p className="text-xs uppercase tracking-[0.2em] text-white/55">
              Aula prevista
            </p>

            {loadState === 'loading' && (
              <div className="mt-5 rounded-[22px] border border-white/10 bg-white/5 px-4 py-5 text-sm text-white/70">
                Carregando dados de curso, professor e alocacao...
              </div>
            )}

            {loadState === 'ready' && nextAllocation && (
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="text-[28px] font-semibold tracking-[-0.05em]">
                    {nextAllocation.module_title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    {formatDateRange(
                      nextAllocation.start_date,
                      nextAllocation.end_date
                    )}{' '}
                    • {nextAllocation.start_time} - {nextAllocation.end_time}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <PublicMetric
                    label="Professor"
                    value={nextProfessor?.name ?? 'Nao encontrado'}
                  />
                  <PublicMetric
                    label="Origem"
                    value={
                      nextProfessor
                        ? `${nextProfessor.city}/${nextProfessor.state}`
                        : 'Sem origem'
                    }
                  />
                </div>

                <div className="rounded-[20px] bg-white/8 px-4 py-3 text-sm text-white/78">
                  Essa caixa ja esta preparada para a rota publica real onde o aluno
                  seleciona o curso e recebe sempre a proxima semana letiva.
                </div>
              </div>
            )}

            {loadState === 'ready' && !nextAllocation && (
              <div className="mt-5 rounded-[22px] border border-white/10 bg-white/5 px-4 py-5 text-sm text-white/70">
                Ainda nao existe alocacao para a proxima semana no curso
                selecionado.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function PublicMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] bg-white/8 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-white/45">{label}</p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function AnalyticsRow() {
  return (
    <section
      id="analytics"
      className="relative z-10 grid gap-4 px-5 pb-5 sm:px-8 lg:grid-cols-[1fr_1.9fr_1fr] lg:px-12 lg:pb-10"
    >
      <DistributionCard />
      <PerformanceCard />
      <AutomationCard />
    </section>
  );
}

function DistributionCard() {
  return (
    <article className="rounded-[28px] border border-[#ededf2] bg-white/92 p-5 shadow-[0_16px_40px_rgba(17,17,20,0.05)]">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[28px] font-semibold tracking-[-0.05em] text-[#16161a]">
            Tipos de Oferta
          </h2>
          <p className="mt-1 text-sm text-[#7a7a84]">Distribuicao por formato</p>
        </div>
        <GraduationCap className="h-5 w-5 text-[#5b61ff]" />
      </div>

      <div className="relative mx-auto mt-8 flex h-[220px] w-[220px] items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_30deg,_#5b61ff_0deg,_#6d4bff_145deg,_#efeff4_145deg,_#efeff4_230deg,_#f6f6f9_230deg,_#f6f6f9_360deg)]" />
        <div className="absolute inset-[22px] rounded-full bg-[#fcfcfd]" />
        <div className="relative z-10 rounded-full bg-white px-6 py-5 text-center shadow-[0_18px_40px_rgba(17,17,20,0.08)]">
          <p className="text-xs text-[#7a7a84]">Semana intensiva</p>
          <p className="mt-1 text-[32px] font-semibold tracking-[-0.05em] text-[#16161a]">
            58%
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-[#6b6b74]">
        <div className="rounded-2xl bg-[#f7f7fa] px-4 py-3">
          <p className="font-medium text-[#16161a]">Presencial</p>
          <p className="mt-1">58%</p>
        </div>
        <div className="rounded-2xl bg-[#f7f7fa] px-4 py-3">
          <p className="font-medium text-[#16161a]">Hibrido</p>
          <p className="mt-1">27%</p>
        </div>
      </div>
    </article>
  );
}

function PerformanceCard() {
  return (
    <article className="rounded-[28px] border border-[#ededf2] bg-white/94 p-5 shadow-[0_16px_40px_rgba(17,17,20,0.05)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[28px] font-semibold tracking-[-0.05em] text-[#16161a]">
            Performance Academica
          </h2>
          <p className="mt-1 text-sm text-[#7a7a84]">
            Ultimos 30 dias de operacao modular
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-[#7a7a84]">
          <LegendDot color="bg-[#5b61ff]" label="Alocacoes" />
          <LegendDot color="bg-[#d8d8e0]" label="Feriados" />
          <LegendDot color="bg-[#ffbf74]" label="Conflitos" />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-[48px_1fr] gap-3">
        <div className="flex h-[255px] flex-col justify-between pb-6 text-xs text-[#8a8a94]">
          <span>320</span>
          <span>240</span>
          <span>160</span>
          <span>80</span>
          <span>0</span>
        </div>

        <div className="relative h-[255px] overflow-hidden rounded-[24px] bg-[linear-gradient(180deg,#ffffff,#fbfbfd)]">
          <ChartGrid />
          <LinePath points={chartPointsGray} color="#d0d0d9" />
          <LinePath points={chartPointsAmber} color="#ffbf74" />
          <LinePath points={chartPointsBlue} color="#5b61ff" />

          <div className="absolute left-[58%] top-[34%] z-20 rounded-2xl border border-[#e7e7ee] bg-white/95 px-4 py-3 text-xs shadow-[0_12px_28px_rgba(17,17,20,0.08)]">
            <p className="font-semibold text-[#16161a]">Junho</p>
            <p className="mt-2 text-[#5b61ff]">Alocacoes: 2600</p>
            <p className="text-[#ffbf74]">Conflitos: 120</p>
            <p className="text-[#8d8d97]">Feriados: 3</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-between px-[60px] text-xs text-[#8a8a94]">
        <span>Mar 1</span>
        <span>Mar 5</span>
        <span>Mar 10</span>
        <span>Mar 15</span>
        <span>Mar 20</span>
        <span>Mar 25</span>
        <span>Mar 31</span>
      </div>
    </article>
  );
}

function AutomationCard() {
  return (
    <article className="rounded-[28px] border border-[#ededf2] bg-white/92 p-5 shadow-[0_16px_40px_rgba(17,17,20,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[28px] font-semibold tracking-[-0.05em] text-[#16161a]">
            Top Fluxos
          </h2>
          <p className="mt-1 text-sm text-[#7a7a84]">Melhor desempenho semanal</p>
        </div>
        <button
          type="button"
          className="text-sm font-medium text-[#5b61ff] transition hover:text-[#463eff]"
        >
          Ver tudo
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {topModules.map((module) => (
          <div
            key={module.title}
            className="rounded-[24px] bg-[#f7f7fa] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
          >
            <p className="text-sm text-[#6e6e78]">{module.title}</p>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-[30px] font-semibold tracking-[-0.05em] text-[#16161a]">
                {module.score}
              </span>
              <span className="text-xs text-[#8a8a94]">{module.detail}</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-white">
              <div
                className={`h-2 rounded-full bg-[linear-gradient(90deg,#5b61ff,#8a56ff)] ${module.progress}`}
              />
            </div>
          </div>
        ))}
      </div>

      <div
        id="features"
        className="mt-5 rounded-[24px] border border-dashed border-[#e6e6ed] bg-white px-4 py-4"
      >
        <p className="text-sm font-medium text-[#16161a]">Fluxos do produto</p>
        <div className="mt-3 space-y-3">
          <MiniAlert
            icon={<Shield className="h-4 w-4" />}
            text="Painel admin com login e senha guardados no Supabase para acesso restrito."
          />
          <MiniAlert
            icon={<Cloud className="h-4 w-4" />}
            text="Cadastros e alocacoes salvos no banco para alimentar analytics e consulta publica."
          />
          <MiniAlert
            icon={<Users className="h-4 w-4" />}
            text="Pagina publica mostra a proxima semana apos o aluno selecionar o curso."
          />
        </div>
      </div>
    </article>
  );
}

function GridBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(233,233,239,0.92)_1px,transparent_1px),linear-gradient(to_bottom,rgba(233,233,239,0.92)_1px,transparent_1px)] bg-[size:33.333%_100%,100%_33.333%]" />
      <BackdropGlow className="left-[27%] top-[23%]" color="bg-[#ff47d6]" />
      <BackdropGlow className="left-[73%] top-[23%]" color="bg-[#5b61ff]" />
      <BackdropGlow className="left-[27%] top-[43%]" color="bg-[#52e5ff]" />
      <BackdropGlow className="left-[73%] top-[43%]" color="bg-[#ffbf35]" />
      <BackdropGlow className="left-[27%] top-[64%]" color="bg-[#ba47ff]" />
      <BackdropGlow className="left-[73%] top-[64%]" color="bg-[#5eff73]" />
      <BlurBlock className="left-[7%] top-[27%]" />
      <BlurBlock className="right-[7%] top-[27%]" />
    </div>
  );
}

function BackdropGlow({
  className,
  color,
}: {
  className: string;
  color: string;
}) {
  return (
    <div className={`absolute ${className}`}>
      <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <div
        className={`absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full blur-md ${color}`}
      />
    </div>
  );
}

function BlurBlock({ className }: { className: string }) {
  return (
    <div
      className={`absolute h-[120px] w-[120px] rounded-[32px] bg-[linear-gradient(180deg,rgba(243,244,247,0.85),rgba(252,252,253,0.1))] blur-[10px] ${className}`}
    />
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function ChartGrid() {
  return (
    <>
      {[...Array.from({ length: 4 })].map((_, index) => (
        <div
          key={`h-${index + 1}`}
          className="absolute left-0 right-0 border-t border-dashed border-[#ececf2]"
          style={{ top: `${(index + 1) * 20}%` }}
        />
      ))}
      {[...Array.from({ length: 5 })].map((_, index) => (
        <div
          key={`v-${index + 1}`}
          className="absolute bottom-0 top-0 border-l border-dashed border-[#f0f0f5]"
          style={{ left: `${(index + 1) * 16}%` }}
        />
      ))}
    </>
  );
}

function LinePath({
  points,
  color,
}: {
  points: number[];
  color: string;
}) {
  const step = 100 / (points.length - 1);
  const d = points
    .map((point, index) => {
      const x = index * step;
      const y = point;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <svg
      viewBox="0 0 100 260"
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full overflow-visible"
    >
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((point, index) => (
        <circle
          key={`${color}-${index}`}
          cx={index * step}
          cy={point}
          r={index === 7 ? 1.8 : 0}
          fill={color}
        />
      ))}
    </svg>
  );
}

function MiniAlert({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-[#f7f7fa] px-3 py-3 text-sm text-[#63636d]">
      <div className="rounded-xl bg-white p-2 text-[#5b61ff] shadow-[0_6px_14px_rgba(17,17,20,0.05)]">
        {icon}
      </div>
      <p className="leading-6">{text}</p>
    </div>
  );
}
