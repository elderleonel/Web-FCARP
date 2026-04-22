'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, GraduationCap, MapPin, Users } from 'lucide-react';
import { loadPlatformData } from '@/lib/unisched-repository';
import {
  buildCronogramaCards,
  formatDateRange,
  getCourseProgress,
  getNextWeekRange,
  getSemesterLabel,
  groupCronogramaCardsBySemester,
  type CronogramaModulo,
  type Curso,
  type Disciplina,
  type EventoFeriado,
  type Intercurso,
  type Professor,
} from '@/lib/unisched-data';

export function ConsultaPublicaClient() {
  const router = useRouter();
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [eventos, setEventos] = useState<EventoFeriado[]>([]);
  const [modulos, setModulos] = useState<CronogramaModulo[]>([]);
  const [intercursos, setIntercursos] = useState<Intercurso[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [loading, setLoading] = useState(true);

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
      setSelectedCourseId((currentCourseId) => currentCourseId || result.cursos[0]?.id || '');
      setLoading(false);
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const selectedCourse = useMemo(
    () => cursos.find((curso) => curso.id === selectedCourseId) ?? cursos[0] ?? null,
    [cursos, selectedCourseId]
  );

  const nextWeek = useMemo(() => getNextWeekRange(), []);

  const courseCards = useMemo(
    () =>
      selectedCourse
        ? buildCronogramaCards(
            selectedCourse.id,
            cursos,
            disciplinas,
            professores,
            modulos,
            intercursos
          )
        : [],
    [selectedCourse, cursos, disciplinas, professores, modulos, intercursos]
  );

  const semesterGroups = useMemo(
    () => groupCronogramaCardsBySemester(courseCards),
    [courseCards]
  );

  const selectedProgress = useMemo(
    () => (selectedCourse ? getCourseProgress(selectedCourse, modulos, intercursos) : null),
    [selectedCourse, modulos, intercursos]
  );

  const nextBlockers = useMemo(
    () =>
      eventos.filter((evento) => {
        const time = new Date(evento.data).getTime();
        return time >= nextWeek.start.getTime() && time <= nextWeek.end.getTime();
      }),
    [eventos, nextWeek]
  );

  const nextModule = useMemo(() => {
    const today = new Date().getTime();

    return courseCards.find((card) => new Date(card.dataFim).getTime() >= today) ?? courseCards[0] ?? null;
  }, [courseCards]);

  const activeSemesters = semesterGroups.length;

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

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-[#d6dee6] bg-[#f8fafc] px-4 py-2 text-xs font-medium text-[#5f6f80]">
                Semana atual: {nextWeek.start.toLocaleDateString('pt-BR')} a{' '}
                {nextWeek.end.toLocaleDateString('pt-BR')}
              </div>
              <Link
                href="/admin/login"
                className="rounded-full bg-[#17324d] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#21446a]"
              >
                Acesso administrativo
              </Link>
            </div>
          </div>
        </header>

        <section className="border-b border-[#e5ebf0] px-6 py-6 sm:px-8">
          <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[24px] border border-[#dfe6ed] bg-[#f8fafc] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#728396]">
                Consulta publica
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#132033]">
                Selecione o curso e veja os calendarios em andamento por semestre
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#607182]">
                O aluno escolhe apenas o curso. Quando houver mais de uma turma ou semestre em
                execucao, os cronogramas aparecem separados automaticamente.
              </p>

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
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <SummaryCard
                label="Curso selecionado"
                value={selectedCourse?.nome ?? '--'}
                secondary={`${activeSemesters} semestre(s) com calendario`}
              />
              <SummaryCard
                label="Proximo modulo"
                value={nextModule?.disciplinaNome ?? 'Sem agenda'}
                secondary={
                  nextModule
                    ? `${getSemesterLabel(nextModule.semestre)} · ${formatDateRange(nextModule.dataInicio, nextModule.dataFim)}`
                    : 'Nenhum modulo cadastrado'
                }
              />
              <SummaryCard
                label="Carga do curso"
                value={
                  selectedProgress
                    ? `${selectedProgress.totalAgendado}h / ${selectedProgress.totalCurso}h`
                    : '--'
                }
                secondary={
                  selectedProgress ? `${selectedProgress.percentual}% concluido` : 'Sem dados'
                }
              />
            </div>
          </div>
        </section>

        <section className="px-6 py-6 sm:px-8">
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-4">
              {loading ? (
                <EmptyState label="Carregando cronogramas..." />
              ) : semesterGroups.length ? (
                semesterGroups.map((group) => (
                  <section
                    key={group.semestre ?? 'sem-semestre'}
                    className="rounded-[24px] border border-[#dfe6ed] bg-[#f8fafc] p-5"
                  >
                    <div className="flex flex-col gap-2 border-b border-[#e3eaf0] pb-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-[#132033]">{group.label}</h2>
                        <p className="mt-1 text-sm text-[#607182]">
                          {group.items.length} modulo(s) programado(s) para este grupo.
                        </p>
                      </div>
                      <span className="rounded-full border border-[#d6dee6] bg-white px-3 py-1 text-xs font-medium text-[#5f6f80]">
                        {selectedCourse?.nome ?? 'Curso'}
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      {group.items.map((card) => (
                        <article
                          key={card.id}
                          className="rounded-[20px] border border-[#dfe6ed] bg-white px-5 py-5"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-[#132033]">
                                {card.disciplinaNome}
                              </h3>
                              <p className="mt-2 text-sm text-[#607182]">
                                {formatDateRange(card.dataInicio, card.dataFim)} ·{' '}
                                {card.cargaHorariaSemanal}h
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {card.cursos.map((curso) => (
                                <span
                                  key={`${card.id}-${curso.id}`}
                                  className="rounded-full border border-[#d6dee6] bg-[#f7fafc] px-3 py-1 text-xs text-[#324355]"
                                >
                                  {curso.nome}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="mt-5 grid gap-3 sm:grid-cols-3">
                            <InfoTile
                              icon={<Users className="h-4 w-4" />}
                              label="Professor"
                              value={card.professorNome ?? 'Nao definido'}
                            />
                            <InfoTile
                              icon={<MapPin className="h-4 w-4" />}
                              label="Origem"
                              value={card.professorCidadeOrigem ?? 'Nao informada'}
                            />
                            <InfoTile
                              icon={<GraduationCap className="h-4 w-4" />}
                              label="Sala"
                              value={card.sala ?? 'Nao informada'}
                            />
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                ))
              ) : (
                <EmptyState label="Nenhum calendario cadastrado para o curso selecionado." />
              )}
            </div>

            <aside className="space-y-4">
              <section className="rounded-[24px] border border-[#dfe6ed] bg-[#f8fafc] p-5">
                <p className="text-sm font-semibold text-[#132033]">Situacao atual</p>
                <div className="mt-4 grid gap-3">
                  <StatusMetric
                    label="Semestres ativos"
                    value={loading ? '--' : String(activeSemesters)}
                  />
                  <StatusMetric
                    label="Modulos visiveis"
                    value={loading ? '--' : String(courseCards.length)}
                  />
                  <StatusMetric
                    label="Bloqueios nesta semana"
                    value={String(nextBlockers.length)}
                  />
                </div>
              </section>

              <section className="rounded-[24px] border border-[#dfe6ed] bg-[#f8fafc] p-5">
                <p className="text-sm font-semibold text-[#132033]">Eventos e bloqueios</p>
                <div className="mt-4 space-y-3">
                  {nextBlockers.length ? (
                    nextBlockers.map((evento) => <EventRow key={evento.id} evento={evento} />)
                  ) : (
                    <EmptyState label="Sem bloqueios registrados para esta semana." />
                  )}
                </div>
              </section>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] border border-[#e1e7ed] bg-[#f8fafc] px-4 py-4">
      <div className="flex items-center gap-2 text-[#607182]">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-[0.16em]">{label}</span>
      </div>
      <p className="mt-2 text-sm font-medium text-[#132033]">{value}</p>
    </div>
  );
}

function StatusMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] border border-[#e1e7ed] bg-white px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#728396]">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-[#132033]">{value}</p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  secondary,
}: {
  label: string;
  value: string;
  secondary: string;
}) {
  return (
    <div className="rounded-[24px] border border-[#dfe6ed] bg-[#f8fafc] px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#728396]">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold text-[#132033]">{value}</p>
      <p className="mt-1 text-sm text-[#607182]">{secondary}</p>
    </div>
  );
}

function EventRow({ evento }: { evento: EventoFeriado }) {
  return (
    <div className="rounded-[20px] border border-[#e1e7ed] bg-white px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[#132033]">{evento.nome}</p>
          <p className="mt-1 text-sm text-[#607182]">{evento.data}</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[#d6dee6] bg-[#f8fafc] px-3 py-1 text-xs uppercase tracking-[0.14em] text-[#5d6d7f]">
          <CalendarDays className="h-3.5 w-3.5" />
          {evento.tipo}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-[20px] border border-[#dfe6ed] bg-white px-4 py-4 text-sm text-[#607182]">
      {label}
    </div>
  );
}
