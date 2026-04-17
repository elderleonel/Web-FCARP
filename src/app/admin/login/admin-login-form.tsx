'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, Mail } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(
    'Informe seu e-mail para receber o magic link de acesso ao FCARP DOC.'
  );
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
    setMessage('Enviando link de acesso...');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/admin/dashboard`,
      },
    });

    if (error) {
      setSubmitting(false);
      setMessage(error.message);
      return;
    }

    setSubmitting(false);
    setMessage(
      'Magic link enviado. Abra o e-mail e conclua o acesso para entrar no painel administrativo.'
    );
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#eef2f6] px-4 py-6 text-[#171717] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md rounded-[32px] border border-white/70 bg-[#fcfcfd] p-6 shadow-[0_30px_90px_rgba(132,146,166,0.18)] sm:p-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#5b61ff]"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para a home
        </Link>

        <div className="mt-6">
          <p className="text-sm font-medium text-[#5b61ff]">Area Admin</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[#121216]">
            Acesso administrativo
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#666672]">
            O FCARP DOC usa Supabase Auth com magic link para liberar o dashboard
            administrativo com seguranca e sem expor senha no fluxo principal.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#4f4f59]">Email</span>
            <div className="flex items-center gap-3 rounded-2xl border border-[#e5e5ec] bg-white px-4 py-3">
              <Mail className="h-4 w-4 text-[#7a7a84]" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full bg-transparent text-sm outline-none"
                placeholder="voce@faculdade.com"
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#5b61ff,#6b36ff)] px-6 py-3 text-sm font-medium text-white shadow-[0_12px_28px_rgba(91,97,255,0.35)] disabled:opacity-70"
          >
            {submitting ? 'Enviando...' : 'Receber magic link'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-4 rounded-2xl border border-[#ececf1] bg-[#f7f7fa] px-4 py-3 text-sm text-[#5d5d66]">
          {message}
        </div>
      </div>
    </main>
  );
}
