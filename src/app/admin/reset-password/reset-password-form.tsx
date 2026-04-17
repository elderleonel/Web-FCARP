'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, LockKeyhole } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(
    'Valide o link recebido por e-mail e informe a nova senha para concluir a recuperacao.'
  );

  useEffect(() => {
    let cancelled = false;

    async function initializeRecovery() {
      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        if (!cancelled) {
          setMessage(
            'Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para redefinir a senha.'
          );
        }
        return;
      }

      const code = searchParams.get('code');

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (cancelled) {
          return;
        }

        if (error) {
          setMessage(
            'Nao foi possivel validar o link de redefinicao. Solicite um novo e-mail e tente novamente.'
          );
          return;
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelled) {
        return;
      }

      if (!session) {
        setMessage(
          'Link de redefinicao invalido ou expirado. Solicite um novo link na tela de login.'
        );
        return;
      }

      setReady(true);
      setMessage('Link validado. Informe a nova senha para concluir o processo.');
    }

    void initializeRecovery();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < 6) {
      setMessage('A nova senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('A confirmacao da senha nao confere.');
      return;
    }

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setMessage(
        'Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para redefinir a senha.'
      );
      return;
    }

    setSubmitting(true);
    setMessage('Atualizando senha...');

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setSubmitting(false);
      setMessage(error.message);
      return;
    }

    router.push('/admin/dashboard');
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#eef2f5] px-4 py-6 text-[#18212b] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-[28px] border border-[#d9e1e8] bg-white shadow-[0_24px_60px_rgba(41,60,84,0.08)]">
        <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
          <section className="border-b border-[#e5ebf0] bg-[#f7fafc] px-6 py-8 lg:border-b-0 lg:border-r lg:px-8">
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#37506a]"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para o login
            </Link>

            <p className="mt-10 text-xs font-semibold uppercase tracking-[0.18em] text-[#6f8092]">
              Recuperacao de acesso
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#132033]">
              Redefinir senha
            </h1>
            <p className="mt-4 text-sm leading-7 text-[#617182]">
              Esta etapa conclui a recuperacao iniciada pelo e-mail enviado ao usuario.
            </p>
          </section>

          <section className="px-6 py-8 sm:px-8 lg:px-10">
            <p className="text-sm font-semibold text-[#17324d]">Nova senha</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#132033]">
              Atualizar credencial
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#617182]">{message}</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#324355]">
                  Nova senha
                </span>
                <div className="flex items-center gap-3 rounded-2xl border border-[#d7e0e8] bg-white px-4 py-3">
                  <LockKeyhole className="h-4 w-4 text-[#6f8092]" />
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full bg-transparent text-sm outline-none"
                    placeholder="Nova senha"
                    autoComplete="new-password"
                    disabled={!ready}
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#324355]">
                  Confirmar senha
                </span>
                <div className="flex items-center gap-3 rounded-2xl border border-[#d7e0e8] bg-white px-4 py-3">
                  <LockKeyhole className="h-4 w-4 text-[#6f8092]" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full bg-transparent text-sm outline-none"
                    placeholder="Repita a nova senha"
                    autoComplete="new-password"
                    disabled={!ready}
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={!ready || submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#17324d] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#21446a] disabled:opacity-70"
              >
                {submitting ? 'Atualizando...' : 'Salvar nova senha'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
