'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CalendarDays, GraduationCap, ShieldCheck, Users } from 'lucide-react';
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
  const router = useRouter();
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [eventos, setEventos] = useState<EventoFeriado[]>([]);
  const [modulos, setModulos] = useState<CronogramaModulo[]>([]);
  const [intercursos, setIntercursos] = useState<Intercurso[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('code');
    const token = searchParams.get('token');
    const type = searchParams.get('type');

    if (code || token || type === 'recovery') {
      router.replace(`/admin/reset-password${window.location.search}`);
      return;
    }

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
  }, [router]);

  const selectedCourse =
    cursos.find((curso) => curso.id === selectedCourseId) ?? cursos[0] ?? null;
  const nextWeek = getNextWeekRange();

  const previewModules = selectedCourse
    ? getUpcomingModulesForCourse(
        selectedCourse.id,
        cursos,
        disciplinas,
        professores,
        modulos,
        intercursos
      ).slice(0, 2)
    : [];

  const selectedProgress = selectedCourse
    ? getCourseProgress(selectedCourse, modulos, intercursos)
    : null;

  const nextBlockers = eventos.filter((evento) => {
    const time = new Date(evento.data).getTime();
    return time >= nextWeek.start.getTime() && time <= nextWeek.end.getTime();
  });

  const stats = useMemo(
    () => [
      { label: 'Cursos atendidos', value: String(cursos.length || 0) },
      { label: 'Docentes cadastrados', value: String(professores.length || 0) },
      { label: 'Modulos registrados', value: String(modulos.length || 0) },
    ],
    [cursos.length, professores.length, modulos.length]
  );

  return (
    <main className="min-h-screen bg-[#eef2f5] px-4 py-6 text-[#18212b] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl rounded-[28px] border border-[#d9e1e8] bg-white shadow-[0_24px_60px_rgba(41,60,84,0.08)]">
        <header className="border-b border-[#e5ebf0] px-6 py-5 sm:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#17324d] text-white">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#667788]">
                  FCARP
                </p>
                <p className="text-xl font-semibold tracking-[-0.03em] text-[#132033]">
                  Calendario Academico
                </p>
              </div>
            </div>

            <nav className="flex flex-wrap items-center gap-3 text-sm">
              <Link
                href="/consulta"
                className="rounded-full border border-[#d6dee6] px-4 py-2 text-[#223245] transition hover:bg-[#f5f8fb]"
              >
                Consulta publica
              </Link>
              <Link
                href="/admin/login"
                className="rounded-full bg-[#17324d] px-4 py-2 font-medium text-white transition hover:bg-[#21446a]"
              >
                Acesso administrativo
              </Link>
            </nav>
          </div>
        </header>

        <section className="px-6 py-8 sm:px-8 sm:py-10">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6b7b8d]">
                Ambiente institucional
              </p>
              <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.05em] text-[#112033] sm:text-5xl">
                Organizacao academica com consulta clara para docentes e estudantes.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[#556476]">
                O sistema centraliza a consulta de modulos, o acompanhamento de carga
                horaria e o acesso administrativo em uma interface objetiva, adequada
                ao uso por diferentes cursos da instituicao.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {stats.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[20px] border border-[#e1e7ed] bg-[#f9fbfc] px-4 py-4"
                  >
                    <p className="text-3xl font-semibold tracking-[-0.04em] text-[#132033]">
                      {item.value}
                    </p>
                    <p className="mt-1 text-sm text-[#617182]">{item.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <InstitutionalCard
                  icon={<GraduationCap className="h-5 w-5" />}
                  title="Consulta por curso"
                  text="Cada curso pode visualizar seu cronograma, progresso e proximas semanas letivas."
                />
                <InstitutionalCard
                  icon={<Users className="h-5 w-5" />}
                  title="Uso compartilhado"
                  text="A interface foi simplificada para leitura rapida por professores, coordenacao e alunos."
                />
                <InstitutionalCard
                  icon={<ShieldCheck className="h-5 w-5" />}
                  title="Acesso administrativo"
                  text="O painel interno permanece reservado para cadastro, atualizacao e controle do calendario."
                />
              </div>
            </div>

            <aside className="rounded-[24px] border border-[#dfe6ed] bg-[#f8fafc] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#708092]">
                    Proxima semana letiva
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#132033]">
                    Panorama por curso
                  </h2>
                </div>
                <div className="rounded-full border border-[#d6dee6] bg-white px-3 py-1 text-xs text-[#5f6f80]">
                  {nextWeek.start.toLocaleDateString('pt-BR')} a{' '}
                  {nextWeek.end.toLocaleDateString('pt-BR')}
                </div>
              </div>

              <label className="mt-5 block">
                <span className="mb-2 block text-sm font-medium text-[#324355]">Curso</span>
                <select
                  value={selectedCourseId}
                  onChange={(event) => setSelectedCourseId(event.target.value)}
                  className="w-full rounded-2xl border border-[#d7e0e8] bg-white px-4 py-3 text-sm text-[#18212b] outline-none transition focus:border-[#17324d]"
                >
                  {cursos.map((curso) => (
                    <option key={curso.id} value={curso.id}>
                      {curso.nome}
                    </option>
                  ))}
                </select>
              </label>

              {selectedProgress ? (
                <div className="mt-5 rounded-[20px] border border-[#dfe6ed] bg-white px-4 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-[#132033]">Carga horaria</p>
                      <p className="mt-1 text-sm text-[#607182]">
                        {selectedProgress.totalAgendado}h de {selectedProgress.totalCurso}h
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[#17324d]">
                      {selectedProgress.percentual}%
                    </p>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-[#e6edf3]">
                    <div
                      className="h-2 rounded-full bg-[#17324d]"
                      style={{ width: `${selectedProgress.percentual}%` }}
                    />
                  </div>
                </div>
              ) : null}

              <div className="mt-5 space-y-3">
                {previewModules.length > 0 ? (
                  previewModules.map((card) => (
                    <article
                      key={card.id}
                      className="rounded-[20px] border border-[#dfe6ed] bg-white px-4 py-4"
                    >
                      <p className="text-base font-semibold text-[#132033]">
                        {card.disciplinaNome}
                      </p>
                      <p className="mt-1 text-sm text-[#607182]">
                        {formatDateRange(card.dataInicio, card.dataFim)}
                      </p>
                      <p className="mt-3 text-sm text-[#425365]">
                        {card.professorNome ?? 'Professor a definir'}
                      </p>
                    </article>
                  ))
                ) : (
                  <div className="rounded-[20px] border border-[#dfe6ed] bg-white px-4 py-4 text-sm text-[#607182]">
                    Nao ha modulos previstos para a proxima semana no curso selecionado.
                  </div>
                )}
              </div>

              <div className="mt-5 rounded-[20px] border border-[#dfe6ed] bg-white px-4 py-4">
                <p className="text-sm font-medium text-[#132033]">Bloqueios da semana</p>
                <p className="mt-1 text-sm text-[#607182]">
                  {nextBlockers.length > 0
                    ? `${nextBlockers.length} evento(s) ou feriado(s) registrado(s) para o periodo.`
                    : 'Nao ha bloqueios registrados para a proxima semana letiva.'}
                </p>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

function InstitutionalCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[20px] border border-[#e1e7ed] bg-white px-4 py-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eef3f7] text-[#17324d]">
        {icon}
      </div>
      <p className="mt-4 text-base font-semibold text-[#132033]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#607182]">{text}</p>
    </div>
  );
}
