-- Track login activity for re-engagement emails (record sales reminders).

alter table public.users
  add column if not exists last_login_at timestamptz,
  add column if not exists last_inactivity_email_sent_at timestamptz;

create index if not exists idx_users_last_login
  on public.users (last_login_at)
  where last_login_at is not null;

comment on column public.users.last_login_at is
  'Last time the owner opened the app / dashboard (client heartbeat)';
comment on column public.users.last_inactivity_email_sent_at is
  'When we last sent a "come back and record sales" email — avoid spam';
