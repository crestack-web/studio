-- Guest + human-agent fields for public support chat (welcome widget ↔ admin inbox)

alter table public.support_tickets
  add column if not exists guest_email text,
  add column if not exists session_id text,
  add column if not exists needs_human boolean not null default false,
  add column if not exists source text default 'widget';

create index if not exists support_tickets_session_idx on public.support_tickets (session_id);
create index if not exists support_tickets_status_updated_idx on public.support_tickets (status, updated_at desc);
create index if not exists support_tickets_needs_human_idx on public.support_tickets (needs_human) where needs_human = true;

create index if not exists support_messages_ticket_created_idx
  on public.support_messages (ticket_id, created_at asc);

-- Allow service role full access (APIs use admin client). RLS already on.
