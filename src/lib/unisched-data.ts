export type Course = {
  id: string;
  name: string;
  area: string;
  totalHours: number;
};

export type Professor = {
  id: string;
  name: string;
  specialty: string;
  city: string;
  state: string;
};

export type Allocation = {
  id: string;
  course_id: string;
  professor_id: string;
  module_title: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  weekdays: number;
};

export const fallbackCourses: Course[] = [
  {
    id: 'course-1',
    name: 'MBA em Gestao Hospitalar',
    area: 'Gestao Hospitalar',
    totalHours: 360,
  },
  {
    id: 'course-2',
    name: 'Pos em Direito e Inovacao',
    area: 'Direito Digital',
    totalHours: 420,
  },
  {
    id: 'course-3',
    name: 'MBA em Lideranca e Pessoas',
    area: 'Psicologia Organizacional',
    totalHours: 400,
  },
];

export const fallbackProfessors: Professor[] = [
  {
    id: 'prof-1',
    name: 'Dra. Helena Prado',
    specialty: 'Gestao Hospitalar',
    city: 'Sao Paulo',
    state: 'SP',
  },
  {
    id: 'prof-2',
    name: 'Prof. Marcos Ribeiro',
    specialty: 'Direito Digital',
    city: 'Cuiaba',
    state: 'MT',
  },
  {
    id: 'prof-3',
    name: 'Dra. Luiza Tavares',
    specialty: 'Psicologia Organizacional',
    city: 'Goiania',
    state: 'GO',
  },
];

export const fallbackAllocations: Allocation[] = [
  {
    id: 'alloc-1',
    course_id: 'course-1',
    professor_id: 'prof-1',
    module_title: 'Planejamento Estrategico em Saude',
    start_date: '2026-04-20',
    end_date: '2026-04-24',
    start_time: '18:30',
    end_time: '22:30',
    weekdays: 5,
  },
  {
    id: 'alloc-2',
    course_id: 'course-2',
    professor_id: 'prof-2',
    module_title: 'Protecao de Dados e IA',
    start_date: '2026-04-20',
    end_date: '2026-04-24',
    start_time: '19:00',
    end_time: '22:00',
    weekdays: 5,
  },
  {
    id: 'alloc-3',
    course_id: 'course-3',
    professor_id: 'prof-3',
    module_title: 'Cultura, Clima e Performance',
    start_date: '2026-04-27',
    end_date: '2026-05-01',
    start_time: '18:30',
    end_time: '22:30',
    weekdays: 5,
  },
];

export function getNextWeekRange(referenceDate = new Date()) {
  const baseDate = new Date(referenceDate);
  const day = baseDate.getDay();
  const distanceToNextMonday = ((8 - day) % 7) || 7;
  const startDate = new Date(baseDate);
  startDate.setDate(baseDate.getDate() + distanceToNextMonday);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 4);
  endDate.setHours(23, 59, 59, 999);

  return {
    start: startDate,
    end: endDate,
  };
}

export function rangesOverlap(
  leftStart: string,
  leftEnd: string,
  rightStart: Date,
  rightEnd: Date
) {
  const leftStartTime = new Date(leftStart).getTime();
  const leftEndTime = new Date(leftEnd).getTime();
  const rightStartTime = rightStart.getTime();
  const rightEndTime = rightEnd.getTime();

  return leftStartTime <= rightEndTime && rightStartTime <= leftEndTime;
}

export function getUpcomingAllocationForCourse(
  courseId: string,
  allocations: Allocation[],
  referenceDate = new Date()
) {
  const nextWeek = getNextWeekRange(referenceDate);

  return (
    allocations
      .filter((allocation) => allocation.course_id === courseId)
      .filter((allocation) =>
        rangesOverlap(
          allocation.start_date,
          allocation.end_date,
          nextWeek.start,
          nextWeek.end
        )
      )
      .sort(
        (left, right) =>
          new Date(left.start_date).getTime() - new Date(right.start_date).getTime()
      )[0] ?? null
  );
}

export function formatDateRange(startDate: string, endDate: string) {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  });

  return `${formatter.format(new Date(startDate))} - ${formatter.format(
    new Date(endDate)
  )}`;
}
