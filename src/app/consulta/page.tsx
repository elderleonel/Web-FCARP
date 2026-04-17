'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, MapPin, Users } from 'lucide-react';
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
  const [source, setSource] = useState<'mock' | 'supabase'>('mock');
  const [message, setMessage] = useState('Carregando cronograma publico...');

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
      setSource(result.source);
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

  return (
    <main className="min-h-screen bg-[#eef2f6] px-4 py-6 text-[#171717] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl rounded-[32px] border border-white/70 bg-[#fcfcfd] p-5 shadow-[0_30px_90px_rgba(132,146,166,0.18)] sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[#163B65]">Painel publico</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[#121216]">
              Cronograma modular por curso
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#666672]">
              Alunos e professores escolhem o curso e visualizam modulos, intercursos,
              semanas bloqueadas e progresso de carga horaria sem precisar de login.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-[#e9e9ef] bg-white px-4 py-2.5 text-sm font-medium text-[#171717]"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="rounded-[28px] border border-[#ececf1] bg-[#f7f7fa] p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-lg font-semibold tracking-[-0.03em] text-[#16161a]">
                Filtro inicial
              </p>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  source === 'supabase'
                    ? 'bg-[#e8fff0] text-[#147a46]'
                    : 'bg-[#fff5e8] text-[#9a5b00]'
                }`}
              >
                {source === 'supabase' ? 'Supabase live' : 'Mock local'}
              </span>
            </div>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-medium text-[#4f4f59]">
                Selecione o curso
              </span>
              <select
                value={selectedCourseId}
                onChange={(event) => setSelectedCourseId(event.target.value)}
                className="w-full rounded-2xl border border-[#e5e5ec] bg-white px-4 py-3 text-sm text-[#171717] outline-none transition focus:border-[#163B65]"
              >
                {cursos.map((curso) => (
                  <option key={curso.id} value={curso.id}>
                    {curso.nome}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-4 rounded-[22px] border border-[#ebebf0] bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#7a7a84]">
                Resumo
              </p>
              <p className="mt-2 text-sm font-medium text-[#16161a]">{message}</p>
              {progress ? (
                <>
                  <p className="mt-3 text-sm text-[#6b6b74]">
                    {progress.totalAgendado}h agendadas de {progress.totalCurso}h totais.
                  </p>
                  <div className="mt-3 h-2 rounded-full bg-[#edf0f3]">
                    <div
                      className="h-2 rounded-full bg-[linear-gradient(90deg,#163B65,#2C6E91)]"
                      style={{ width: `${progress.percentual}%` }}
                    />
                  </div>
                </>
              ) : null}
            </div>

            <div className="mt-4 rounded-[22px] border border-[#ebebf0] bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#7a7a84]">
                Legenda
              </p>
              <div className="mt-3 space-y-2 text-sm text-[#5d5d66]">
                <p>Cards com mais de um chip indicam modulo compartilhado entre cursos.</p>
                <p>Entradas cinza sinalizam feriados e eventos que bloqueiam novas aulas.</p>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] bg-[linear-gradient(135deg,#111827,#1f2937)] p-5 text-white">
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">
              Linha do tempo
            </p>

            <div className="mt-4 space-y-4">
              {cards.length > 0 ? (
                cards.map((card) => (
                  <article
                    key={card.id}
                    className="rounded-[24px] border border-white/10 bg-white/6 px-4 py-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="text-xl font-semibold tracking-[-0.04em]">
                          {card.disciplinaNome}
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-white/70">
                          {formatDateRange(card.dataInicio, card.dataFim)} •{' '}
                          {card.cargaHorariaSemanal}h
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
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
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <ConsultaInfo
                        icon={<Users className="h-4 w-4" />}
                        label="Professor"
                        value={card.professorNome ?? 'Nao definido'}
                      />
                      <ConsultaInfo
                        icon={<MapPin className="h-4 w-4" />}
                        label="Origem"
                        value={card.professorCidadeOrigem ?? 'Sem origem'}
                      />
                      <ConsultaInfo
                        icon={<CalendarDays className="h-4 w-4" />}
                        label="Sala"
                        value={card.sala ?? 'Nao informada'}
                      />
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-5 text-sm text-white/70">
                  Nenhum modulo cadastrado para este curso ainda.
                </div>
              )}

              {eventos.map((evento) => (
                <div
                  key={evento.id}
                  className="rounded-[24px] border border-white/8 bg-white/4 px-4 py-4 text-sm text-white/72"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{evento.nome}</p>
                      <p className="mt-1">{evento.data}</p>
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em]">
                      {evento.tipo}
                    </span>
                  </div>
                </div>
              ))}
            </div>
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
    <div className="rounded-[20px] bg-white/8 px-4 py-3">
      <div className="flex items-center gap-2 text-white/55">
        {icon}
        <span className="text-xs uppercase tracking-[0.18em]">{label}</span>
      </div>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}
