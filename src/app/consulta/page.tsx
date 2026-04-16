'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, Cloud, MapPin, Users } from 'lucide-react';
import { loadPublicScheduleData } from '@/lib/unisched-repository';
import {
  formatDateRange,
  getNextWeekRange,
  getUpcomingAllocationForCourse,
  type Allocation,
  type Course,
  type Professor,
} from '@/lib/unisched-data';

export default function ConsultaPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [source, setSource] = useState<'mock' | 'supabase'>('mock');
  const [message, setMessage] = useState('Carregando cronograma...');

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const result = await loadPublicScheduleData();

      if (!isMounted) {
        return;
      }

      setCourses(result.courses);
      setProfessors(result.professors);
      setAllocations(result.allocations);
      setSelectedCourseId(result.courses[0]?.id ?? '');
      setSource(result.source);
      setMessage(result.message);
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const nextWeek = getNextWeekRange();
  const selectedCourse =
    courses.find((course) => course.id === selectedCourseId) ?? courses[0] ?? null;
  const allocation = selectedCourse
    ? getUpcomingAllocationForCourse(selectedCourse.id, allocations)
    : null;
  const professor = allocation
    ? professors.find((item) => item.id === allocation.professor_id) ?? null
    : null;

  const formatter = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  });

  return (
    <main className="min-h-screen bg-[#eef2f6] px-4 py-6 text-[#171717] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl rounded-[32px] border border-white/70 bg-[#fcfcfd] p-5 shadow-[0_30px_90px_rgba(132,146,166,0.18)] sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[#5b61ff]">Consulta publica</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[#121216]">
              Proxima semana letiva
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#666672]">
              O aluno seleciona o curso e o sistema mostra a aula planejada para a
              proxima semana, com professor, horario e periodo.
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

        <div className="mt-8 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[28px] border border-[#ececf1] bg-[#f7f7fa] p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-lg font-semibold tracking-[-0.03em] text-[#16161a]">
                Curso
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
                className="w-full rounded-2xl border border-[#e5e5ec] bg-white px-4 py-3 text-sm text-[#171717] outline-none transition focus:border-[#5b61ff]"
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-4 rounded-[22px] border border-[#ebebf0] bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#7a7a84]">
                Janela consultada
              </p>
              <p className="mt-2 text-sm font-medium text-[#16161a]">
                {formatter.format(nextWeek.start)} - {formatter.format(nextWeek.end)}
              </p>
              <p className="mt-3 text-sm leading-6 text-[#6b6b74]">{message}</p>
            </div>
          </section>

          <section className="rounded-[28px] bg-[linear-gradient(135deg,#111827,#1f2937)] p-5 text-white">
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">
              Aula prevista
            </p>

            {allocation ? (
              <div className="mt-4">
                <h2 className="text-[34px] font-semibold tracking-[-0.06em]">
                  {allocation.module_title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-white/70">
                  {formatDateRange(allocation.start_date, allocation.end_date)} •{' '}
                  {allocation.start_time} - {allocation.end_time}
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <ConsultaInfo
                    icon={<Users className="h-4 w-4" />}
                    label="Professor"
                    value={professor?.name ?? 'Nao encontrado'}
                  />
                  <ConsultaInfo
                    icon={<MapPin className="h-4 w-4" />}
                    label="Origem"
                    value={
                      professor
                        ? `${professor.city}/${professor.state}`
                        : 'Sem origem'
                    }
                  />
                  <ConsultaInfo
                    icon={<CalendarDays className="h-4 w-4" />}
                    label="Dias letivos"
                    value={`${allocation.weekdays} dias`}
                  />
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-[22px] border border-white/10 bg-white/5 px-4 py-5 text-sm text-white/70">
                Ainda nao existe aula cadastrada para a proxima semana no curso
                selecionado.
              </div>
            )}
          </section>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[#ececf1] bg-white px-4 py-3 text-sm text-[#5d5d66]">
          <Cloud className="h-4 w-4" />
          Esta rota ja usa Supabase quando as variaveis e tabelas estiverem prontas.
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
