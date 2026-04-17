create extension if not exists "uuid-ossp";

create table if not exists cursos (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  carga_horaria_total integer not null check (carga_horaria_total > 0),
  cor_hex text
);

create table if not exists professores (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  cidade_origem text,
  especialidade text
);

create table if not exists disciplinas (
  id uuid primary key default uuid_generate_v4(),
  nome text not null unique
);

do $$ begin
  if not exists (select 1 from pg_type where typname = 'evento_tipo') then
    create type evento_tipo as enum ('feriado', 'evento');
  end if;
end $$;

create table if not exists eventos_feriados (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  data date not null,
  tipo evento_tipo not null,
  constraint eventos_feriados_unique unique (data, nome)
);

create table if not exists cronograma_modulos (
  id uuid primary key default uuid_generate_v4(),
  disciplina_id uuid not null references disciplinas(id),
  professor_id uuid references professores(id) on delete set null,
  data_inicio date not null,
  data_fim date not null,
  carga_horaria_semanal integer not null check (carga_horaria_semanal > 0),
  sala text,
  observacoes text,
  constraint cronograma_data_ck check (data_fim >= data_inicio)
);

create table if not exists intercursos (
  cronograma_modulo_id uuid not null references cronograma_modulos(id) on delete cascade,
  curso_id uuid not null references cursos(id) on delete cascade,
  primary key (cronograma_modulo_id, curso_id)
);

create index if not exists idx_intercursos_curso on intercursos (curso_id);
create index if not exists idx_intercursos_modulo on intercursos (cronograma_modulo_id);

alter table cursos enable row level security;
alter table professores enable row level security;
alter table disciplinas enable row level security;
alter table eventos_feriados enable row level security;
alter table cronograma_modulos enable row level security;
alter table intercursos enable row level security;

drop policy if exists "public read cursos" on cursos;
create policy "public read cursos"
on cursos for select
to anon, authenticated
using (true);

drop policy if exists "public read professores" on professores;
create policy "public read professores"
on professores for select
to anon, authenticated
using (true);

drop policy if exists "public read disciplinas" on disciplinas;
create policy "public read disciplinas"
on disciplinas for select
to anon, authenticated
using (true);

drop policy if exists "public read eventos" on eventos_feriados;
create policy "public read eventos"
on eventos_feriados for select
to anon, authenticated
using (true);

drop policy if exists "public read cronograma" on cronograma_modulos;
create policy "public read cronograma"
on cronograma_modulos for select
to anon, authenticated
using (true);

drop policy if exists "public read intercursos" on intercursos;
create policy "public read intercursos"
on intercursos for select
to anon, authenticated
using (true);

drop policy if exists "authenticated manage cursos" on cursos;
create policy "authenticated manage cursos"
on cursos for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated manage professores" on professores;
create policy "authenticated manage professores"
on professores for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated manage disciplinas" on disciplinas;
create policy "authenticated manage disciplinas"
on disciplinas for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated manage eventos" on eventos_feriados;
create policy "authenticated manage eventos"
on eventos_feriados for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated manage cronograma" on cronograma_modulos;
create policy "authenticated manage cronograma"
on cronograma_modulos for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated manage intercursos" on intercursos;
create policy "authenticated manage intercursos"
on intercursos for all
to authenticated
using (true)
with check (true);
