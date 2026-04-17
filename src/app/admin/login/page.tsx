import { redirect } from 'next/navigation';
import { AdminLoginForm } from '@/app/admin/login/admin-login-form';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export default async function AdminLoginPage() {
  const supabase = await getSupabaseServerClient();

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect('/admin/dashboard');
    }
  }

  return <AdminLoginForm />;
}
