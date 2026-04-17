'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, LockKeyhole, Mail } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('Entre com seu e-mail e sua senha para acessar o painel administrativo.');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setMessage(
        'Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para habilitar o login.'
      );
      return;
    }

    setSubmitting(true);
    setMessage('Validando acesso...');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setSubmitting(false);
      setMessage(error.message);
      return;
    }

    router.push('/admin/dashboard');
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#eef2f6] px-4 py-6 text-[#171717] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl rounded-[32px] border border-white/70 bg-[#fcfcfd] shadow-[0_30px_90px_rgba(132,146,166,0.18)]">
        <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
          <section className="relative overflow-hidden rounded-t-[32px] border-b border-[#ececf1] bg-[linear-gradient(160deg,#123457,#1b5574)] p-6 text-white lg:rounded-l-[32px] lg:rounded-tr-none lg:border-b-0 lg:border-r">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.14),transparent_26%)]" />
            <div className="relative z-10">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-white/86"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para a home
              </Link>

              <div className="mt-12 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/12 backdrop-blur">
                <CalendarDays className="h-6 w-6" />
              </div>

              <p className="mt-8 text-sm font-medium uppercase tracking-[0.18em] text-white/62">
                FCARP DOC
              </p>
              <h1 className="mt-3 max-w-sm text-4xl font-semibold tracking-[-0.05em] text-white">
                Acesso ao painel administrativo
              </h1>
              <p className="mt-4 max-w-md text-sm leading-7 text-white/74">
                Entre com as credenciais do Supabase para gerenciar cursos, cronograma,
                bloqueios e operacao academica em um unico lugar.
              </p>

              <div className="mt-8 space-y-3">
                <FeatureRow text="Login direto com e-mail e senha" />
                <FeatureRow text="Redirecionamento automatico para o dashboard" />
                <FeatureRow text="Mesma base de autenticacao do projeto em producao" />
              </div>
            </div>
          </section>

          <section className="p-6 sm:p-8 lg:p-10">
            <div className="mx-auto max-w-md">
              <p className="text-sm font-medium text-[#5b61ff]">Area Admin</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[#121216]">
                Entrar
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#666672]">
                Use suas credenciais ativas do Supabase para continuar.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#4f4f59]">E-mail</span>
                  <div className="flex items-center gap-3 rounded-2xl border border-[#e5e5ec] bg-white px-4 py-3 shadow-[0_6px_16px_rgba(20,20,23,0.03)]">
                    <Mail className="h-4 w-4 text-[#7a7a84]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full bg-transparent text-sm outline-none"
                      placeholder="voce@fcarp.com.br"
                      autoComplete="email"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#4f4f59]">Senha</span>
                  <div className="flex items-center gap-3 rounded-2xl border border-[#e5e5ec] bg-white px-4 py-3 shadow-[0_6px_16px_rgba(20,20,23,0.03)]">
                    <LockKeyhole className="h-4 w-4 text-[#7a7a84]" />
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full bg-transparent text-sm outline-none"
                      placeholder="Sua senha"
                      autoComplete="current-password"
                    />
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#163B65,#2C6E91)] px-6 py-3 text-sm font-medium text-white shadow-[0_12px_28px_rgba(22,59,101,0.28)] disabled:opacity-70"
                >
                  {submitting ? 'Entrando...' : 'Acessar painel'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              <div className="mt-4 rounded-2xl border border-[#ececf1] bg-[#f7f7fa] px-4 py-3 text-sm text-[#5d5d66]">
                {message}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function FeatureRow({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-sm text-white/80 backdrop-blur">
      {text}
    </div>
  );
}
