-- ============================================================
-- Zapli — Migration 002: Row Level Security (RLS)
-- Garante isolamento total de dados entre empresas (multi-tenant)
-- Execute APÓS a migration 001
-- ============================================================

-- ─────────────────────────────────────────────────────────
-- Habilita RLS em todas as tabelas
-- ─────────────────────────────────────────────────────────
ALTER TABLE tenants           ENABLE ROW LEVEL SECURITY;
ALTER TABLE users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns         ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals             ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients           ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_flows         ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────
-- Helper: retorna o tenant_id do usuário autenticado
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION auth_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM users WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: verifica se o usuário é admin do sistema
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND system_role = 'admin'
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: verifica se o usuário é gestor do tenant
CREATE OR REPLACE FUNCTION is_gestor()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND tenant_role = 'gestor'
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────
-- TENANTS — Cada usuário vê apenas seu próprio tenant
-- ─────────────────────────────────────────────────────────
CREATE POLICY "tenants_select_own"
  ON tenants FOR SELECT
  USING (id = auth_tenant_id() OR is_admin());

CREATE POLICY "tenants_update_gestor"
  ON tenants FOR UPDATE
  USING (id = auth_tenant_id() AND is_gestor())
  WITH CHECK (id = auth_tenant_id());

-- ─────────────────────────────────────────────────────────
-- USERS — Usuários veem apenas colegas do mesmo tenant
-- ─────────────────────────────────────────────────────────
CREATE POLICY "users_select_same_tenant"
  ON users FOR SELECT
  USING (tenant_id = auth_tenant_id() OR is_admin());

CREATE POLICY "users_update_own_profile"
  ON users FOR UPDATE
  USING (id = auth.uid() OR (is_gestor() AND tenant_id = auth_tenant_id()));

CREATE POLICY "users_insert_gestor"
  ON users FOR INSERT
  WITH CHECK (is_gestor() OR is_admin());

CREATE POLICY "users_delete_gestor"
  ON users FOR DELETE
  USING (is_gestor() AND tenant_id = auth_tenant_id() AND id != auth.uid());

-- ─────────────────────────────────────────────────────────
-- CONTACTS — Todos do mesmo tenant podem ver
--            Apenas gestor pode deletar
-- ─────────────────────────────────────────────────────────
CREATE POLICY "contacts_select_tenant"
  ON contacts FOR SELECT
  USING (tenant_id = auth_tenant_id());

CREATE POLICY "contacts_insert_tenant"
  ON contacts FOR INSERT
  WITH CHECK (tenant_id = auth_tenant_id());

CREATE POLICY "contacts_update_tenant"
  ON contacts FOR UPDATE
  USING (tenant_id = auth_tenant_id());

CREATE POLICY "contacts_delete_gestor"
  ON contacts FOR DELETE
  USING (tenant_id = auth_tenant_id() AND is_gestor());

-- ─────────────────────────────────────────────────────────
-- MESSAGES — Todos do tenant podem ler e criar
-- ─────────────────────────────────────────────────────────
CREATE POLICY "messages_select_tenant"
  ON messages FOR SELECT
  USING (tenant_id = auth_tenant_id());

CREATE POLICY "messages_insert_tenant"
  ON messages FOR INSERT
  WITH CHECK (tenant_id = auth_tenant_id());

-- ─────────────────────────────────────────────────────────
-- CAMPAIGNS — Gestor gerencia, demais apenas leem
-- ─────────────────────────────────────────────────────────
CREATE POLICY "campaigns_select_tenant"
  ON campaigns FOR SELECT
  USING (tenant_id = auth_tenant_id());

CREATE POLICY "campaigns_insert_gestor"
  ON campaigns FOR INSERT
  WITH CHECK (tenant_id = auth_tenant_id() AND is_gestor());

CREATE POLICY "campaigns_update_gestor"
  ON campaigns FOR UPDATE
  USING (tenant_id = auth_tenant_id() AND is_gestor());

CREATE POLICY "campaigns_delete_gestor"
  ON campaigns FOR DELETE
  USING (tenant_id = auth_tenant_id() AND is_gestor());

-- ─────────────────────────────────────────────────────────
-- DEALS — Todos do tenant podem manipular
-- ─────────────────────────────────────────────────────────
CREATE POLICY "deals_select_tenant"
  ON deals FOR SELECT
  USING (tenant_id = auth_tenant_id());

CREATE POLICY "deals_insert_tenant"
  ON deals FOR INSERT
  WITH CHECK (tenant_id = auth_tenant_id());

CREATE POLICY "deals_update_tenant"
  ON deals FOR UPDATE
  USING (tenant_id = auth_tenant_id());

CREATE POLICY "deals_delete_gestor"
  ON deals FOR DELETE
  USING (tenant_id = auth_tenant_id() AND is_gestor());

-- ─────────────────────────────────────────────────────────
-- CLIENTS — Todos do tenant
-- ─────────────────────────────────────────────────────────
CREATE POLICY "clients_all_tenant"
  ON clients FOR ALL
  USING (tenant_id = auth_tenant_id());

-- ─────────────────────────────────────────────────────────
-- NOTIFICATIONS — Usuário vê as suas + as do tenant (gestor)
-- ─────────────────────────────────────────────────────────
CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (
    tenant_id = auth_tenant_id() AND (
      user_id = auth.uid() OR
      (user_id IS NULL AND is_gestor())
    )
  );

CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (tenant_id = auth_tenant_id() AND (user_id = auth.uid() OR is_gestor()));

CREATE POLICY "notifications_insert_system"
  ON notifications FOR INSERT
  WITH CHECK (tenant_id = auth_tenant_id());

-- ─────────────────────────────────────────────────────────
-- AGENT_CONNECTIONS — Apenas gestor gerencia
--                     Vendedor/SDR apenas lê
-- ─────────────────────────────────────────────────────────
CREATE POLICY "agent_select_tenant"
  ON agent_connections FOR SELECT
  USING (tenant_id = auth_tenant_id());

CREATE POLICY "agent_upsert_gestor"
  ON agent_connections FOR INSERT
  WITH CHECK (tenant_id = auth_tenant_id() AND is_gestor());

CREATE POLICY "agent_update_gestor"
  ON agent_connections FOR UPDATE
  USING (tenant_id = auth_tenant_id() AND is_gestor());

-- ─────────────────────────────────────────────────────────
-- BOT_FLOWS — Apenas gestor configura
-- ─────────────────────────────────────────────────────────
CREATE POLICY "bot_select_tenant"
  ON bot_flows FOR SELECT
  USING (tenant_id = auth_tenant_id());

CREATE POLICY "bot_upsert_gestor"
  ON bot_flows FOR INSERT
  WITH CHECK (tenant_id = auth_tenant_id() AND is_gestor());

CREATE POLICY "bot_update_gestor"
  ON bot_flows FOR UPDATE
  USING (tenant_id = auth_tenant_id() AND is_gestor());
