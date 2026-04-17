'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  FileUp,
  FolderLock,
  LogOut,
  Plus,
  Shield,
  Users,
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import { loadPublicScheduleData } from '@/lib/unisched-repository';
import type { Course } from '@/lib/unisched-data';

const STORAGE_BUCKET = 'private-files';

type StoredFile = {
  createdAt: string | null;
  name: string;
  path: string;
  size: number | null;
};

type AdminDashboardClientProps = {
  userEmail: string;
};

export function AdminDashboardClient({
  userEmail,
}: AdminDashboardClientProps) {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [statusMessage, setStatusMessage] = useState(
    'Cadastre cursos no banco e envie arquivos para o bucket protegido do Supabase.'
  );
  const [authMessage, setAuthMessage] = useState(`Sessao ativa para ${userEmail}.`);
  const [loading, setLoading] = useState(true);
  const [submittingCourse, setSubmittingCourse] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [courseArea, setCourseArea] = useState('');
  const [courseHours, setCourseHours] = useState('360');

  const totalStorageBytes = useMemo(
    () => files.reduce((sum, file) => sum + (file.size ?? 0), 0),
    [files]
  );

  async function refreshFiles(userId: string) {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(userId, {
        limit: 25,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      setStatusMessage(
        'Login funcionando, mas o bucket private-files ainda nao esta pronto ou falta politica de acesso.'
      );
      setFiles([]);
      return;
    }

    setFiles(
      (data ?? []).map((file) => ({
        createdAt: file.created_at ?? null,
        name: file.name,
        path: `${userId}/${file.name}`,
        size: file.metadata?.size ?? null,
      }))
    );
  }

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

      const [
        { data: userResult, error: userError },
        publicData,
      ] = await Promise.all([supabase.auth.getUser(), loadPublicScheduleData()]);

      if (!isMounted) {
        return;
      }

      if (userError || !userResult.user) {
        router.replace('/admin/login');
        return;
      }

      setAuthMessage(`Sessao ativa para ${userResult.user.email ?? userEmail}.`);
      setCourses(publicData.courses);
      setStatusMessage(publicData.message);

      await refreshFiles(userResult.user.id);

      if (isMounted) {
        setLoading(false);
      }
    }

    void bootstrapDashboard();

    return () => {
      isMounted = false;
    };
  }, [router, userEmail]);

  async function handleCreateCourse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setStatusMessage('Supabase nao configurado no ambiente.');
      return;
    }

    setSubmittingCourse(true);
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
      setSubmittingCourse(false);
      setStatusMessage(error.message);
      return;
    }

    setCourses((current) => [...current, data as Course]);
    setCourseName('');
    setCourseArea('');
    setCourseHours('360');
    setSubmittingCourse(false);
    setStatusMessage('Curso salvo no Supabase com sucesso.');
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setStatusMessage('Supabase nao configurado no ambiente.');
      return;
    }

    setUploadingFile(true);
    setStatusMessage('Enviando arquivo para o Storage...');

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setUploadingFile(false);
      setStatusMessage('Sua sessao expirou. Entre novamente.');
      router.replace('/admin/login');
      return;
    }

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const filePath = `${user.id}/${Date.now()}-${sanitizedName}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      setUploadingFile(false);
      setStatusMessage(uploadError.message);
      event.target.value = '';
      return;
    }

    const { error: metadataError } = await supabase.from('file_uploads').insert({
      bucket: STORAGE_BUCKET,
      content_type: file.type || null,
      original_name: file.name,
      path: filePath,
      size_bytes: file.size,
      user_id: user.id,
    });

    await refreshFiles(user.id);

    setUploadingFile(false);
    setStatusMessage(
      metadataError
        ? 'Arquivo enviado ao Storage, mas a tabela file_uploads ainda nao existe ou nao aceita a gravacao.'
        : 'Arquivo protegido enviado ao Supabase com metadados salvos.'
    );
    event.target.value = '';
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
              Painel com Auth, banco e Storage
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
          <div className="space-y-4">
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
                    A rota protegida grava dados direto na tabela `courses`.
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
                  disabled={submittingCourse || loading}
                  className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#5b61ff,#6b36ff)] px-5 py-3 text-sm font-medium text-white shadow-[0_12px_28px_rgba(91,97,255,0.35)] disabled:opacity-70"
                >
                  <Plus className="h-4 w-4" />
                  {submittingCourse ? 'Salvando...' : 'Salvar curso'}
                </button>
              </form>
            </section>

            <section className="rounded-[28px] border border-[#ececf1] bg-[#f7f7fa] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ecfff2] text-[#147a46]">
                  <FileUp className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#16161a]">
                    Upload protegido
                  </h2>
                  <p className="text-sm text-[#6b6b74]">
                    Envie pequenos arquivos ao bucket privado `{STORAGE_BUCKET}`.
                  </p>
                </div>
              </div>

              <label className="mt-5 block rounded-[24px] border border-dashed border-[#d5d7df] bg-white px-4 py-6 text-center">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploadingFile || loading}
                  className="hidden"
                />
                <span className="inline-flex items-center gap-2 rounded-full bg-[#121216] px-4 py-2 text-sm font-medium text-white">
                  <FileUp className="h-4 w-4" />
                  {uploadingFile ? 'Enviando...' : 'Selecionar arquivo'}
                </span>
                <p className="mt-3 text-sm leading-6 text-[#5d5d66]">
                  O arquivo fica isolado por usuario no Storage e os metadados podem ir para
                  a tabela `file_uploads`.
                </p>
              </label>
            </section>

            <div className="rounded-2xl border border-[#ececf1] bg-white px-4 py-3 text-sm text-[#5d5d66]">
              {statusMessage}
            </div>
          </div>

          <section className="rounded-[28px] bg-[linear-gradient(135deg,#111827,#1f2937)] p-5 text-white">
            <div className="grid gap-3 sm:grid-cols-4">
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
              <AdminStat
                icon={<FolderLock className="h-4 w-4" />}
                label="Arquivos"
                value={String(files.length)}
              />
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-[24px] bg-white/8 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/45">
                  Cursos cadastrados
                </p>

                <div className="mt-4 space-y-3">
                  {courses.length > 0 ? (
                    courses.map((course) => (
                      <div
                        key={course.id}
                        className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3"
                      >
                        <p className="text-sm font-medium text-white">{course.name}</p>
                        <p className="mt-1 text-sm text-white/65">
                          {course.area} • {course.totalHours}h
                        </p>
                      </div>
                    ))
                  ) : (
                    <EmptyCard text="Nenhum curso encontrado no banco ainda." />
                  )}
                </div>
              </div>

              <div className="rounded-[24px] bg-white/8 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/45">
                    Arquivos protegidos
                  </p>
                  <span className="text-xs text-white/55">
                    {formatBytes(totalStorageBytes)}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {files.length > 0 ? (
                    files.map((file) => (
                      <div
                        key={file.path}
                        className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3"
                      >
                        <p className="truncate text-sm font-medium text-white">{file.name}</p>
                        <p className="mt-1 text-sm text-white/65">
                          {formatBytes(file.size)} • {formatDate(file.createdAt)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <EmptyCard text="Nenhum arquivo listado. Crie o bucket e envie o primeiro arquivo." />
                  )}
                </div>
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

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/4 px-4 py-4 text-sm text-white/65">
      {text}
    </div>
  );
}

function formatBytes(value: number | null) {
  if (!value || Number.isNaN(value)) {
    return '0 KB';
  }

  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string | null) {
  if (!value) {
    return 'sem data';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}
