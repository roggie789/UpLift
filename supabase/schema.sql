-- UpLift database schema (matches the ER diagram on the Miro planning board)
-- Run in the Supabase SQL editor, or via: supabase db push

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

-- ---------- Row Level Security ----------
-- Every table is locked to the owning user; the app talks straight to
-- Postgres with the anon key and these policies do the authorization.

alter table profiles enable row level security;
create policy "own profile" on profiles for all using (id = auth.uid()) with check (id = auth.uid());

alter table exercises enable row level security;
create policy "read exercises" on exercises for select using (is_custom = false or created_by = auth.uid());
create policy "create custom exercises" on exercises for insert with check (is_custom = true and created_by = auth.uid());

alter table workout_templates enable row level security;
create policy "own templates" on workout_templates for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table template_exercises enable row level security;
create policy "own template exercises" on template_exercises for all
  using (exists (select 1 from workout_templates t where t.id = template_id and t.user_id = auth.uid()))
  with check (exists (select 1 from workout_templates t where t.id = template_id and t.user_id = auth.uid()));

alter table workout_sessions enable row level security;
create policy "own sessions" on workout_sessions for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table session_exercises enable row level security;
create policy "own session exercises" on session_exercises for all
  using (exists (select 1 from workout_sessions s where s.id = session_id and s.user_id = auth.uid()))
  with check (exists (select 1 from workout_sessions s where s.id = session_id and s.user_id = auth.uid()));

alter table set_logs enable row level security;
create policy "own set logs" on set_logs for all
  using (exists (
    select 1 from session_exercises se
    join workout_sessions s on s.id = se.session_id
    where se.id = session_exercise_id and s.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from session_exercises se
    join workout_sessions s on s.id = se.session_id
    where se.id = session_exercise_id and s.user_id = auth.uid()
  ));

alter table personal_records enable row level security;
create policy "own prs" on personal_records for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table xp_events enable row level security;
create policy "own xp events" on xp_events for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table achievements enable row level security;
create policy "own achievements" on achievements for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table streaks enable row level security;
create policy "own streak" on streaks for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- RPCs ----------

-- Creates a template plus its exercises in one call.
create or replace function create_template(p_name text, p_icon text, p_exercises jsonb)
returns uuid
language plpgsql security invoker as $$
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
language plpgsql security invoker as $$
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
