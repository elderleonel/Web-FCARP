import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import {
  fallbackAllocations,
  fallbackCourses,
  fallbackProfessors,
  type Allocation,
  type Course,
  type Professor,
} from '@/lib/unisched-data';

export type PublicScheduleData = {
  allocations: Allocation[];
  courses: Course[];
  message: string;
  professors: Professor[];
  source: 'mock' | 'supabase';
};

export async function loadPublicScheduleData(): Promise<PublicScheduleData> {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return {
      courses: fallbackCourses,
      professors: fallbackProfessors,
      allocations: fallbackAllocations,
      source: 'mock',
      message:
        'NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY ainda nao foram definidos.',
    };
  }

  const [coursesResult, professorsResult, allocationsResult] = await Promise.all([
    supabase
      .from('courses')
      .select('id, name, area, totalHours')
      .order('name', { ascending: true }),
    supabase
      .from('professors')
      .select('id, name, specialty, city, state')
      .order('name', { ascending: true }),
    supabase
      .from('allocations')
      .select(
        'id, course_id, professor_id, module_title, start_date, end_date, start_time, end_time, weekdays'
      )
      .order('start_date', { ascending: true }),
  ]);

  if (coursesResult.error || professorsResult.error || allocationsResult.error) {
    return {
      courses: fallbackCourses,
      professors: fallbackProfessors,
      allocations: fallbackAllocations,
      source: 'mock',
      message:
        'Supabase conectado, mas as tabelas esperadas ainda nao responderam. Mantive os dados de exemplo.',
    };
  }

  if (
    !coursesResult.data?.length ||
    !professorsResult.data?.length ||
    !allocationsResult.data?.length
  ) {
    return {
      courses: fallbackCourses,
      professors: fallbackProfessors,
      allocations: fallbackAllocations,
      source: 'mock',
      message:
        'Supabase conectado, mas sem registros suficientes para substituir o mock.',
    };
  }

  return {
    courses: coursesResult.data as Course[],
    professors: professorsResult.data as Professor[],
    allocations: allocationsResult.data as Allocation[],
    source: 'supabase',
    message: 'Consulta publica alimentada por dados reais do Supabase.',
  };
}
