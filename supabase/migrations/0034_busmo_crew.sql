-- Busmo Crew: agent memory, tasks, activity, permissions, schedules
-- Phase 3 foundation for autonomous operating layer

CREATE TABLE IF NOT EXISTS crew_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id text NOT NULL,
  agent_id text NOT NULL,
  kind text NOT NULL DEFAULT 'note',
  content text NOT NULL,
  ref_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  importance smallint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

CREATE INDEX IF NOT EXISTS crew_memories_biz_agent_idx
  ON crew_memories (business_id, agent_id, created_at DESC);

CREATE TABLE IF NOT EXISTS crew_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id text NOT NULL,
  agent_id text NOT NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by text,
  approved_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS crew_tasks_biz_status_idx
  ON crew_tasks (business_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS crew_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id text NOT NULL,
  agent_id text,
  type text NOT NULL,
  summary text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS crew_activities_biz_idx
  ON crew_activities (business_id, created_at DESC);

CREATE TABLE IF NOT EXISTS crew_permissions (
  business_id text NOT NULL,
  agent_id text NOT NULL,
  can_read boolean NOT NULL DEFAULT true,
  can_draft boolean NOT NULL DEFAULT true,
  can_execute boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (business_id, agent_id)
);

CREATE TABLE IF NOT EXISTS crew_schedules (
  business_id text NOT NULL,
  check_key text NOT NULL,
  interval_minutes integer NOT NULL DEFAULT 1440,
  last_run_at timestamptz,
  enabled boolean NOT NULL DEFAULT true,
  PRIMARY KEY (business_id, check_key)
);

ALTER TABLE crew_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_schedules ENABLE ROW LEVEL SECURITY;

-- Service role / server routes use admin client; policies for authenticated owners later
