'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, GraduationCap, MapPin, Users } from 'lucide-react';
import { loadPlatformData } from '@/lib/unisched-repository';
import {
  buildCronogramaCards,
  formatDateRange,
  getCourseProgress,
  type CronogramaModulo,
  type Curso,
  type Disciplina,
  type EventoFeriado,
  type Intercurso,
  type Professor,
} from '@/lib/unisched-data';

export default function ConsultaPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [eventos, setEventos] = useState<EventoFeriado[]>([]);
  const [modulos, setModulos] = useState<CronogramaModulo[]>([]);
  const [intercursos, setIntercursos] = useState<Intercurso[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [message, setMessage] = useState('Carregando cronograma...');

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
      setMessage(result.message);
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedCourse =
    cursos.find((curso) => curso.id === selectedCourseId) ?? cursos[0] ?? null;

  const cards = useMemo(
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

  const progress = selectedCourse
    ? getCourseProgress(selectedCourse, modulos, intercursos)
    : null;
  const visibleEventos = eventos.slice(0, 4);

  return (
    <main className="min-h-screen bg-[#eef2f5] px-4 py-6 text-[#18212b] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl rounded-[28px] border border-[#d9e1e8] bg-white shadow-[0_24px_60px_rgba(41,60,84,0.08)]">
        <header className="border-b border-[#e5ebf0] px-6 py-5 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f8092]">
                Consulta publica
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#132033]">
                Cronograma academico por curso
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#617182]">
                Consulta destinada a estudantes, professores e coordenacao para
                visualizacao objetiva dos modulos planejados.
              </p>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-[#d6dee6] px-4 py-2 text-sm text-[#223245] transition hover:bg-[#f5f8fb]"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </div>
        </header>

        <div className="grid gap-6 px-6 py-8 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="rounded-[24px] border border-[#dfe6ed] bg-[#f8fafc] p-5">
            <p className="text-sm font-semibold text-[#17324d]">Filtro e resumo</p>

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

            <div className="mt-5 rounded-[20px] border border-[#dfe6ed] bg-white px-4 py-4">
              <p className="text-sm font-medium text-[#132033]">Situacao atual</p>
              <p className="mt-2 text-sm leading-6 text-[#607182]">{message}</p>
            </div>

            {progress ? (
              <div className="mt-4 rounded-[20px] border border-[#dfe6ed] bg-white px-4 py-4">
                <p className="text-sm font-medium text-[#132033]">Carga horaria do curso</p>
                <p className="mt-2 text-sm text-[#607182]">
                  {progress.totalAgendado}h agendadas de {progress.totalCurso}h totais.
                </p>
                <div className="mt-3 h-2 rounded-full bg-[#e6edf3]">
                  <div
                    className="h-2 rounded-full bg-[#17324d]"
                    style={{ width: `${progress.percentual}%` }}
                  />
                </div>
              </div>
            ) : null}

            <div className="mt-4 rounded-[20px] border border-[#dfe6ed] bg-white px-4 py-4">
              <p className="text-sm font-medium text-[#132033]">Eventos e bloqueios</p>
              <p className="mt-2 text-sm text-[#607182]">
                {eventos.length > 0
                  ? `${eventos.length} registro(s) encontrado(s) para acompanhamento academico.`
                  : 'Nao ha eventos ou bloqueios cadastrados.'}
              </p>
            </div>

            <div className="mt-4 rounded-[20px] border border-[#dfe6ed] bg-white px-4 py-4">
              <p className="text-sm font-medium text-[#132033]">Orientacao de uso</p>
              <p className="mt-2 text-sm leading-6 text-[#607182]">
                Esta area e destinada a consulta. Cadastros, ajustes de carga horaria e montagem do calendario permanecem restritos ao painel administrativo.
              </p>
            </div>
          </aside>

          <section className="space-y-4">
            <div className="rounded-[24px] border border-[#dfe6ed] bg-[#f8fafc] px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#728396]">
                Visao do curso
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <ConsultaMetric label="Curso" value={selectedCourse?.nome ?? 'Nao definido'} />
                <ConsultaMetric label="Modulos visiveis" value={String(cards.length)} />
                <ConsultaMetric label="Bloqueios cadastrados" value={String(eventos.length)} />
              </div>
            </div>
            {cards.length > 0 ? (
              cards.map((card) => (
                <article
                  key={card.id}
                  className="rounded-[24px] border border-[#dfe6ed] bg-white px-5 py-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#728396]">
                        Modulo
                      </p>
                      <h2 className="mt-2 text-xl font-semibold text-[#132033]">
                        {card.disciplinaNome}
                      </h2>
                      <p className="mt-2 text-sm text-[#607182]">
                        {formatDateRange(card.dataInicio, card.dataFim)} -{' '}
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
                    <ConsultaInfo
                      icon={<Users className="h-4 w-4" />}
                      label="Professor"
                      value={card.professorNome ?? 'Nao definido'}
                    />
                    <ConsultaInfo
                      icon={<MapPin className="h-4 w-4" />}
                      label="Origem"
                      value={card.professorCidadeOrigem ?? 'Nao informada'}
                    />
                    <ConsultaInfo
                      icon={<GraduationCap className="h-4 w-4" />}
                      label="Sala"
                      value={card.sala ?? 'Nao informada'}
                    />
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[24px] border border-[#dfe6ed] bg-white px-5 py-5 text-sm text-[#607182]">
                Nenhum modulo cadastrado para este curso.
              </div>
            )}

            {visibleEventos.map((evento) => (
              <div
                key={evento.id}
                className="rounded-[20px] border border-[#e1e7ed] bg-[#f8fafc] px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[#132033]">{evento.nome}</p>
                    <p className="mt-1 text-sm text-[#607182]">{evento.data}</p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#d6dee6] bg-white px-3 py-1 text-xs uppercase tracking-[0.14em] text-[#5d6d7f]">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {evento.tipo}
                  </div>
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}

function ConsultaInfo({
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

function ConsultaMetric({
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
