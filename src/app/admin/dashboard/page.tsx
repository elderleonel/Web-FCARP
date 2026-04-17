import { redirect } from 'next/navigation';
import { AdminDashboardClient } from '@/app/admin/dashboard/admin-dashboard-client';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export default async function AdminDashboardPage() {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    redirect('/admin/login');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  return <AdminDashboardClient userEmail={user.email ?? 'usuario admin'} />;
}
