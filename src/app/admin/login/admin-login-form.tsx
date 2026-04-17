'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, LockKeyhole, Mail } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [message, setMessage] = useState(
    'Informe suas credenciais institucionais para acessar o painel administrativo.'
  );
  const [submitting, setSubmitting] = useState(false);
  const [recovering, setRecovering] = useState(false);

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

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setSubmitting(false);
      setMessage(error.message);
      return;
    }

    router.push('/admin/dashboard');
    router.refresh();
  }

  async function handlePasswordRecovery(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setMessage(
        'Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para habilitar a recuperacao.'
      );
      return;
    }

    setRecovering(true);
    setMessage('Enviando orientacoes para redefinicao...');

    const { error } = await supabase.auth.resetPasswordForEmail(recoveryEmail, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });

    setRecovering(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(
      'Enviamos um link de redefinicao para o e-mail informado. Abra a mensagem e conclua a troca de senha.'
    );
  }

  return (
    <main className="min-h-screen bg-[#eef2f5] px-4 py-6 text-[#18212b] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-[28px] border border-[#d9e1e8] bg-white shadow-[0_24px_60px_rgba(41,60,84,0.08)]">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
          <section className="border-b border-[#e5ebf0] bg-[#f7fafc] px-6 py-8 lg:border-b-0 lg:border-r lg:px-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#37506a]"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para a pagina inicial
            </Link>

            <p className="mt-10 text-xs font-semibold uppercase tracking-[0.18em] text-[#6f8092]">
              FCARP
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#132033]">
              Acesso administrativo
            </h1>
            <p className="mt-4 text-sm leading-7 text-[#617182]">
              Esta area e destinada a servidores e responsaveis pela manutencao do
              calendario academico. O acesso requer credenciais validas do Supabase.
            </p>
          </section>

          <section className="px-6 py-8 sm:px-8 lg:px-10">
            <p className="text-sm font-semibold text-[#17324d]">Autenticacao</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#132033]">
              Entrar no painel
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#617182]">
              Utilize o e-mail e a senha cadastrados no ambiente administrativo.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#324355]">E-mail</span>
                <div className="flex items-center gap-3 rounded-2xl border border-[#d7e0e8] bg-white px-4 py-3">
                  <Mail className="h-4 w-4 text-[#6f8092]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full bg-transparent text-sm outline-none"
                    placeholder="usuario@instituicao.br"
                    autoComplete="email"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#324355]">Senha</span>
                <div className="flex items-center gap-3 rounded-2xl border border-[#d7e0e8] bg-white px-4 py-3">
                  <LockKeyhole className="h-4 w-4 text-[#6f8092]" />
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full bg-transparent text-sm outline-none"
                    placeholder="Senha de acesso"
                    autoComplete="current-password"
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#17324d] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#21446a] disabled:opacity-70"
              >
                {submitting ? 'Entrando...' : 'Acessar painel'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-4 rounded-2xl border border-[#e3e9ef] bg-[#f8fafc] px-4 py-3 text-sm text-[#5c6d7f]">
              {message}
            </div>

            <div className="mt-8 border-t border-[#e5ebf0] pt-6">
              <p className="text-sm font-semibold text-[#17324d]">Esqueci minha senha</p>
              <p className="mt-2 text-sm leading-6 text-[#617182]">
                Informe o e-mail cadastrado para receber o link de redefinicao.
              </p>

              <form onSubmit={handlePasswordRecovery} className="mt-4 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#324355]">
                    E-mail para recuperacao
                  </span>
                  <div className="flex items-center gap-3 rounded-2xl border border-[#d7e0e8] bg-white px-4 py-3">
                    <Mail className="h-4 w-4 text-[#6f8092]" />
                    <input
                      type="email"
                      value={recoveryEmail}
                      onChange={(event) => setRecoveryEmail(event.target.value)}
                      className="w-full bg-transparent text-sm outline-none"
                      placeholder="usuario@instituicao.br"
                      autoComplete="email"
                    />
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={recovering}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#ccd8e4] px-6 py-3 text-sm font-medium text-[#17324d] transition hover:bg-[#f6f9fb] disabled:opacity-70"
                >
                  {recovering ? 'Enviando link...' : 'Enviar link de redefinicao'}
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
