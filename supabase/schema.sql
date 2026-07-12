-- UpLift database schema (matches the ER diagram on the Miro planning board)
-- ALREADY APPLIED to the Supabase project (kkldtzcabmejkmdeckqz) as migrations
-- `initial_schema` and `lock_down_handle_new_user`. Kept here as reference.

create extension if not exists "uuid-ossp";

-- ---------- Tables ----------

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null default 'Lifter',
  level int not null default 1,
  total_xp int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table exercises (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  muscle_group text not null,
  equipment text not null default 'other',
  is_custom boolean not null default false,
  created_by uuid references auth.users,
  updated_at timestamptz not null default now()
);

create table workout_templates (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  icon text not null default '💪',
  position int not null default 0,
  updated_at timestamptz not null default now()
);

create table template_exercises (
  id uuid primary key default uuid_generate_v4(),
  template_id uuid not null references workout_templates on delete cascade,
  exercise_id uuid not null references exercises,
  order_index int not null default 0,
  default_sets int not null default 3,
  target_reps int not null default 8,
  updated_at timestamptz not null default now()
);

create table workout_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users on delete cascade,
  template_id uuid references workout_templates on delete set null,
  started_at timestamptz not null,
  finished_at timestamptz not null default now(),
  total_xp int not null default 0,
  updated_at timestamptz not null default now()
);

create table session_exercises (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references workout_sessions on delete cascade,
  exercise_id uuid not null references exercises,
  order_index int not null default 0,
  updated_at timestamptz not null default now()
);

create table set_logs (
  id uuid primary key default uuid_generate_v4(),
  session_exercise_id uuid not null references session_exercises on delete cascade,
  set_number int not null,
  weight_kg numeric(6,2) not null,
  reps int not null,
  rpe numeric(3,1),
  completed_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create table personal_records (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users on delete cascade,
  exercise_id uuid not null references exercises,
  set_log_id uuid references set_logs on delete set null,
  record_type text not null check (record_type in ('weight', 'reps')),
  value numeric(8,2) not null,
  achieved_at timestamptz not null default now()
);

create table xp_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users on delete cascade,
  session_id uuid references workout_sessions on delete set null,
  source text not null,
  amount int not null,
  created_at timestamptz not null default now()
);

create table achievements (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users on delete cascade,
  badge_key text not null,
  unlocked_at timestamptz not null default now(),
  unique (user_id, badge_key)
);

create table streaks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references auth.users on delete cascade,
  current_count int not null default 0,
  best_count int not null default 0,
  multiplier numeric(3,2) not null default 1.0,
  last_workout_date date,
  updated_at timestamptz not null default now()
);

-- ---------- Indexes on foreign keys used by list queries ----------

create index idx_workout_templates_user on workout_templates (user_id, position);
create index idx_template_exercises_template on template_exercises (template_id, order_index);
create index idx_template_exercises_exercise on template_exercises (exercise_id);
create index idx_workout_sessions_user_started on workout_sessions (user_id, started_at desc);
create index idx_workout_sessions_template on workout_sessions (template_id);
create index idx_session_exercises_session on session_exercises (session_id, order_index);
create index idx_session_exercises_exercise on session_exercises (exercise_id);
create index idx_set_logs_session_exercise on set_logs (session_exercise_id);
create index idx_personal_records_user_exercise on personal_records (user_id, exercise_id);
create index idx_personal_records_exercise on personal_records (exercise_id);
create index idx_personal_records_set_log on personal_records (set_log_id);
create index idx_xp_events_user on xp_events (user_id);
create index idx_xp_events_session on xp_events (session_id);
create index idx_achievements_user on achievements (user_id);
create index idx_exercises_created_by on exercises (created_by);

-- ---------- Row Level Security ----------
-- Every table is locked to the owning user; the app talks straight to
-- Postgres with the publishable key and these policies do the authorization.
-- auth.uid() is wrapped in (select ...) so Postgres evaluates it once per
-- query instead of once per row (RLS performance best practice).

alter table profiles enable row level security;
create policy "own profile" on profiles for all using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

alter table exercises enable row level security;
create policy "read exercises" on exercises for select using (is_custom = false or created_by = (select auth.uid()));
create policy "create custom exercises" on exercises for insert with check (is_custom = true and created_by = (select auth.uid()));

alter table workout_templates enable row level security;
create policy "own templates" on workout_templates for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

alter table template_exercises enable row level security;
create policy "own template exercises" on template_exercises for all
  using (exists (select 1 from workout_templates t where t.id = template_id and t.user_id = (select auth.uid())))
  with check (exists (select 1 from workout_templates t where t.id = template_id and t.user_id = (select auth.uid())));

alter table workout_sessions enable row level security;
create policy "own sessions" on workout_sessions for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

alter table session_exercises enable row level security;
create policy "own session exercises" on session_exercises for all
  using (exists (select 1 from workout_sessions s where s.id = session_id and s.user_id = (select auth.uid())))
  with check (exists (select 1 from workout_sessions s where s.id = session_id and s.user_id = (select auth.uid())));

alter table set_logs enable row level security;
create policy "own set logs" on set_logs for all
  using (exists (
    select 1 from session_exercises se
    join workout_sessions s on s.id = se.session_id
    where se.id = session_exercise_id and s.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from session_exercises se
    join workout_sessions s on s.id = se.session_id
    where se.id = session_exercise_id and s.user_id = (select auth.uid())
  ));

alter table personal_records enable row level security;
create policy "own prs" on personal_records for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

alter table xp_events enable row level security;
create policy "own xp events" on xp_events for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

alter table achievements enable row level security;
create policy "own achievements" on achievements for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

alter table streaks enable row level security;
create policy "own streak" on streaks for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ---------- Auto-create profile and streak on signup ----------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Lifter'));
  insert into public.streaks (user_id) values (new.id);
  return new;
end $$;

-- Only the auth trigger may run this — never the public RPC endpoint.
revoke execute on function public.handle_new_user() from anon, authenticated, public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- RPCs ----------

-- Creates a template plus its exercises in one call.
create or replace function create_template(p_name text, p_icon text, p_exercises jsonb)
returns uuid
language plpgsql security invoker
set search_path = public
as $$
declare
  v_template_id uuid;
  v_row jsonb;
begin
  insert into workout_templates (user_id, name, icon)
  values (auth.uid(), p_name, p_icon)
  returning id into v_template_id;

  for v_row in select * from jsonb_array_elements(p_exercises) loop
    insert into template_exercises (template_id, exercise_id, order_index, default_sets, target_reps)
    values (
      v_template_id,
      (v_row->>'exercise_id')::uuid,
      (v_row->>'order_index')::int,
      (v_row->>'default_sets')::int,
      (v_row->>'target_reps')::int
    );
  end loop;

  return v_template_id;
end $$;

-- Writes an entire finished workout (session + exercises + sets + XP event)
-- in ONE call — the single API write for a whole gym session.
create or replace function finish_workout(
  p_template_id uuid,
  p_started_at timestamptz,
  p_total_xp int,
  p_exercises jsonb
)
returns uuid
language plpgsql security invoker
set search_path = public
as $$
declare
  v_session_id uuid;
  v_session_exercise_id uuid;
  v_exercise jsonb;
  v_set jsonb;
begin
  insert into workout_sessions (user_id, template_id, started_at, total_xp)
  values (auth.uid(), p_template_id, p_started_at, p_total_xp)
  returning id into v_session_id;

  for v_exercise in select * from jsonb_array_elements(p_exercises) loop
    insert into session_exercises (session_id, exercise_id, order_index)
    values (v_session_id, (v_exercise->>'exercise_id')::uuid, (v_exercise->>'order_index')::int)
    returning id into v_session_exercise_id;

    for v_set in select * from jsonb_array_elements(v_exercise->'sets') loop
      insert into set_logs (session_exercise_id, set_number, weight_kg, reps, rpe, completed_at)
      values (
        v_session_exercise_id,
        (v_set->>'set_number')::int,
        (v_set->>'weight_kg')::numeric,
        (v_set->>'reps')::int,
        nullif(v_set->>'rpe', '')::numeric,
        (v_set->>'completed_at')::timestamptz
      );
    end loop;
  end loop;

  insert into xp_events (user_id, session_id, source, amount)
  values (auth.uid(), v_session_id, 'workout', p_total_xp);

  update profiles set total_xp = total_xp + p_total_xp, updated_at = now()
  where id = auth.uid();

  return v_session_id;
end $$;

-- Returns per-exercise all-time bests (for PR detection) and the sets from
-- the most recent session (for input placeholders) in ONE call — the single
-- API read needed to start a workout.
create or replace function get_workout_prep(p_exercise_ids uuid[])
returns table (
  exercise_id uuid,
  max_weight_kg numeric,
  max_reps int,
  last_sets jsonb
)
language sql security invoker
set search_path = public
as $$
  with my_sets as (
    select se.exercise_id, sl.weight_kg, sl.reps, s.started_at, sl.set_number
    from set_logs sl
    join session_exercises se on se.id = sl.session_exercise_id
    join workout_sessions s on s.id = se.session_id
    where s.user_id = auth.uid()
      and se.exercise_id = any(p_exercise_ids)
  ),
  bests as (
    select exercise_id, max(weight_kg) as max_weight_kg, max(reps) as max_reps
    from my_sets
    group by exercise_id
  ),
  last_session as (
    select distinct on (exercise_id) exercise_id, started_at
    from my_sets
    order by exercise_id, started_at desc
  ),
  last_sets as (
    select m.exercise_id,
      jsonb_agg(jsonb_build_object('weight_kg', m.weight_kg, 'reps', m.reps) order by m.set_number) as sets
    from my_sets m
    join last_session l on l.exercise_id = m.exercise_id and l.started_at = m.started_at
    group by m.exercise_id
  )
  select b.exercise_id, b.max_weight_kg, b.max_reps, coalesce(ls.sets, '[]'::jsonb)
  from bests b
  left join last_sets ls on ls.exercise_id = b.exercise_id
$$;

-- ---------- Seed: starter exercise library ----------

insert into exercises (name, muscle_group, equipment) values
  ('Barbell Squat', 'legs', 'barbell'),
  ('Bench Press', 'chest', 'barbell'),
  ('Deadlift', 'back', 'barbell'),
  ('Overhead Press', 'shoulders', 'barbell'),
  ('Barbell Row', 'back', 'barbell'),
  ('Pull Up', 'back', 'bodyweight'),
  ('Dumbbell Curl', 'arms', 'dumbbell'),
  ('Tricep Pushdown', 'arms', 'cable'),
  ('Leg Press', 'legs', 'machine'),
  ('Lateral Raise', 'shoulders', 'dumbbell');
