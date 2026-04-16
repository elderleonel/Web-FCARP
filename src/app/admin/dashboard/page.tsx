'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  LogOut,
  Plus,
  Shield,
  Users,
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import { loadPublicScheduleData } from '@/lib/unisched-repository';
import type { Course } from '@/lib/unisched-data';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [authMessage, setAuthMessage] = useState('Verificando sessao...');
  const [statusMessage, setStatusMessage] = useState(
    'Preencha os dados para cadastrar um curso no Supabase.'
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [courseArea, setCourseArea] = useState('');
  const [courseHours, setCourseHours] = useState('360');

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

      const [{ data: sessionData }, publicData] = await Promise.all([
        supabase.auth.getSession(),
        loadPublicScheduleData(),
      ]);

      if (!isMounted) {
        return;
      }

      if (!sessionData.session) {
        router.replace('/admin/login');
        return;
      }

      setCourses(publicData.courses);
      setAuthMessage(`Sessao ativa para ${sessionData.session.user.email ?? 'usuario admin'}.`);
      setStatusMessage(publicData.message);
      setLoading(false);
    }

    void bootstrapDashboard();

    return () => {
      isMounted = false;
    };
  }, [router]);

  async function handleCreateCourse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setStatusMessage('Supabase nao configurado no ambiente.');
      return;
    }

    setSubmitting(true);
    setStatusMessage('Salvando curso...');

    const { data, error } = await supabase
      .from('courses')
      .insert({
        name: courseName,
        area: courseArea,
        totalHours: Number(courseHours),
      })
      .select('id, name, area, totalHours')
      .single();

    if (error) {
      setSubmitting(false);
      setStatusMessage(error.message);
      return;
    }

    setCourses((current) => [...current, data as Course]);
    setCourseName('');
    setCourseArea('');
    setCourseHours('360');
    setSubmitting(false);
    setStatusMessage('Curso salvo no Supabase com sucesso.');
  }

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient();

    if (supabase) {
      await supabase.auth.signOut();
    }

    router.push('/admin/login');
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#eef2f6] px-4 py-6 text-[#171717] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl rounded-[32px] border border-white/70 bg-[#fcfcfd] p-5 shadow-[0_30px_90px_rgba(132,146,166,0.18)] sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[#5b61ff]">Dashboard admin</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[#121216]">
              Painel com Supabase Auth
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

        <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_1.1fr]">
          <section className="rounded-[28px] border border-[#ececf1] bg-[#f7f7fa] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef0ff] text-[#5b61ff]">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#16161a]">
                  Novo curso
                </h2>
                <p className="text-sm text-[#6b6b74]">
                  Persistencia inicial ligada ao Supabase.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateCourse} className="mt-5 space-y-4">
              <AdminInput
                label="Nome do curso"
                value={courseName}
                onChange={setCourseName}
                placeholder="MBA em Gestao Publica"
              />
              <AdminInput
                label="Area"
                value={courseArea}
                onChange={setCourseArea}
                placeholder="Gestao"
              />
              <AdminInput
                label="Carga horaria"
                value={courseHours}
                onChange={setCourseHours}
                type="number"
                placeholder="360"
              />

              <button
                type="submit"
                disabled={submitting || loading}
                className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#5b61ff,#6b36ff)] px-5 py-3 text-sm font-medium text-white shadow-[0_12px_28px_rgba(91,97,255,0.35)] disabled:opacity-70"
              >
                <Plus className="h-4 w-4" />
                {submitting ? 'Salvando...' : 'Salvar curso'}
              </button>
            </form>

            <div className="mt-4 rounded-2xl border border-[#ececf1] bg-white px-4 py-3 text-sm text-[#5d5d66]">
              {statusMessage}
            </div>
          </section>

          <section className="rounded-[28px] bg-[linear-gradient(135deg,#111827,#1f2937)] p-5 text-white">
            <div className="grid gap-3 sm:grid-cols-3">
              <AdminStat
                icon={<Users className="h-4 w-4" />}
                label="Cursos"
                value={String(courses.length)}
              />
              <AdminStat
                icon={<CalendarDays className="h-4 w-4" />}
                label="Rotas"
                value="3"
              />
              <AdminStat
                icon={<Shield className="h-4 w-4" />}
                label="Auth"
                value="Ativo"
              />
            </div>

            <div className="mt-5 rounded-[24px] bg-white/8 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/45">
                Cursos cadastrados
              </p>

              <div className="mt-4 space-y-3">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3"
                  >
                    <p className="text-sm font-medium text-white">{course.name}</p>
                    <p className="mt-1 text-sm text-white/65">
                      {course.area} • {course.totalHours}h
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function AdminInput({
  label,
  onChange,
  placeholder,
  type = 'text',
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: React.HTMLInputTypeAttribute;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[#4f4f59]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-[#e5e5ec] bg-white px-4 py-3 text-sm text-[#171717] outline-none transition focus:border-[#5b61ff]"
      />
    </label>
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
