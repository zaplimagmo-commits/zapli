-- ============================================================
-- Zapli — Migration 001: Schema inicial
-- Execute no SQL Editor do Supabase Dashboard
-- URL: https://ohhawgidwrvlpiiasytp.supabase.co
-- ============================================================

-- Habilita extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- busca por texto

-- ─────────────────────────────────────────────────────────
-- TENANTS — Empresas cadastradas no Zapli
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  plan          TEXT NOT NULL DEFAULT 'starter'
                  CHECK (plan IN ('starter','pro','enterprise')),
  plan_status   TEXT NOT NULL DEFAULT 'trial'
                  CHECK (plan_status IN ('active','trial','suspended','cancelled')),
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────
-- USERS — Usuários (um por perfil: gestor, vendedor, sdr)
-- Ligados ao auth.users do Supabase Auth
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id     UUID REFERENCES tenants(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  tenant_role   TEXT NOT NULL DEFAULT 'vendedor'
                  CHECK (tenant_role IN ('gestor','vendedor','sdr')),
  system_role   TEXT NOT NULL DEFAULT 'user'
                  CHECK (system_role IN ('admin','user')),
  avatar_url    TEXT,
  phone         TEXT,
  active        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────
-- CONTACTS — Leads e prospectos de cada empresa
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contacts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  phone           TEXT NOT NULL,         -- formato: "5511999990001"
  company         TEXT,
  email           TEXT,
  status          TEXT NOT NULL DEFAULT 'novo'
                    CHECK (status IN ('novo','em_contato','positivo','convertido','nao_interessado')),
  stage           TEXT NOT NULL DEFAULT 'prospecting'
                    CHECK (stage IN ('prospecting','contacted','qualified','proposal','closed')),
  assigned_to     UUID REFERENCES users(id) ON DELETE SET NULL,
  notes           TEXT,
  tags            TEXT[] DEFAULT '{}',
  source          TEXT,
  last_message_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  -- Impede duplicata de número por empresa
  UNIQUE (tenant_id, phone)
);

-- ─────────────────────────────────────────────────────────
-- MESSAGES — Histórico completo de mensagens
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contact_id    UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  direction     TEXT NOT NULL CHECK (direction IN ('sent','received')),
  source        TEXT NOT NULL DEFAULT 'bot' CHECK (source IN ('bot','human')),
  sent_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  sent_by_name  TEXT,
  sent_by_role  TEXT,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','sent','delivered','read','failed')),
  whatsapp_id   TEXT,                    -- ID real da msg no WhatsApp
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────
-- CAMPAIGNS — Campanhas de prospecção em massa
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaigns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  message         TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','scheduled','running','paused','completed')),
  contacts_count  INTEGER DEFAULT 0,
  sent_count      INTEGER DEFAULT 0,
  failed_count    INTEGER DEFAULT 0,
  scheduled_at    TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────
-- DEALS — Negócios no CRM (pipeline de vendas)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contact_id      UUID REFERENCES contacts(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  value           DECIMAL(12,2) DEFAULT 0,
  stage           TEXT NOT NULL DEFAULT 'lead'
                    CHECK (stage IN ('lead','qualified','proposal','negotiation','closed_won','closed_lost')),
  probability     INTEGER DEFAULT 50 CHECK (probability BETWEEN 0 AND 100),
  expected_close  DATE,
  assigned_to     UUID REFERENCES users(id) ON DELETE SET NULL,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────
-- CLIENTS — Clientes fechados (pós-venda)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  company     TEXT,
  phone       TEXT,
  email       TEXT,
  plan        TEXT,
  mrr         DECIMAL(12,2) DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'ativo'
                CHECK (status IN ('ativo','pausado','cancelado')),
  start_date  DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────
-- NOTIFICATIONS — Notificações do sistema por empresa
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  title         TEXT,
  message       TEXT NOT NULL,
  type          TEXT NOT NULL DEFAULT 'system_info'
                  CHECK (type IN (
                    'positive_response','followup_needed','converted',
                    'system_info','system_success','system_warning'
                  )),
  contact_id    UUID REFERENCES contacts(id) ON DELETE SET NULL,
  contact_name  TEXT,
  read          BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────
-- AGENT_CONNECTIONS — Status do Zapli Agent por empresa
-- Uma linha por empresa (UNIQUE tenant_id)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_connections (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  status         TEXT NOT NULL DEFAULT 'offline'
                   CHECK (status IN ('offline','online','connecting','connected','sleeping')),
  device_type    TEXT CHECK (device_type IN ('mobile','desktop','unknown')),
  device_name    TEXT,
  profile_name   TEXT,
  profile_phone  TEXT,
  connected_at   TIMESTAMPTZ,
  last_seen      TIMESTAMPTZ,
  sent_today     INTEGER DEFAULT 0,
  sent_total     INTEGER DEFAULT 0,
  agent_version  TEXT DEFAULT '1.0.0',
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────
-- BOT_FLOWS — Configuração do bot por empresa
-- Uma linha por empresa (UNIQUE tenant_id)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bot_flows (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  active              BOOLEAN DEFAULT TRUE,
  initial_message     TEXT NOT NULL DEFAULT 'Olá {{nome}}, tudo bem? Sou da {{empresa_origem}} e gostaria de apresentar...',
  followup_message    TEXT NOT NULL DEFAULT 'Olá {{nome}}, passando para verificar se recebeu minha mensagem anterior...',
  followup_days       INTEGER DEFAULT 3,
  positive_keywords   TEXT[] DEFAULT ARRAY['interesse','quanto','valor','quero','sim','pode','enviar'],
  negative_keywords   TEXT[] DEFAULT ARRAY['não quero','remove','para','não','nunca'],
  daily_limit         INTEGER DEFAULT 150,
  min_delay_seconds   INTEGER DEFAULT 45,
  max_delay_seconds   INTEGER DEFAULT 120,
  send_days           INTEGER[] DEFAULT ARRAY[1,2,3,4,5],   -- 1=Seg ... 7=Dom
  send_hour_start     INTEGER DEFAULT 8,
  send_hour_end       INTEGER DEFAULT 18,
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────
-- ÍNDICES — Performance em consultas frequentes
-- ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_contacts_tenant      ON contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contacts_status      ON contacts(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_contacts_phone       ON contacts(tenant_id, phone);
CREATE INDEX IF NOT EXISTS idx_messages_contact     ON messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_messages_tenant      ON messages(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deals_tenant         ON deals(tenant_id, stage);
CREATE INDEX IF NOT EXISTS idx_notifications_user   ON notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_tenant     ON campaigns(tenant_id, status);

-- Busca por texto em contatos
CREATE INDEX IF NOT EXISTS idx_contacts_name_trgm
  ON contacts USING gin(name gin_trgm_ops);

-- ─────────────────────────────────────────────────────────
-- TRIGGERS — updated_at automático
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_agent_connections_updated_at
  BEFORE UPDATE ON agent_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_bot_flows_updated_at
  BEFORE UPDATE ON bot_flows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
