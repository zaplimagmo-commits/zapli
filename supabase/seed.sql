-- ============================================================
-- Zapli — Seed: Dados iniciais de demonstração
-- Execute no SQL Editor do Supabase APÓS as migrations 001 e 002
-- ============================================================

-- ─────────────────────────────────────────────────────────
-- Tenant de demonstração
-- ─────────────────────────────────────────────────────────
INSERT INTO tenants (id, name, slug, plan, plan_status)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'Construtora ABC', 'construtora-abc', 'pro',     'active'),
  ('11111111-0000-0000-0000-000000000002', 'Fornecedor XYZ',  'fornecedor-xyz',  'starter', 'trial')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────
-- Configuração do bot (uma por tenant)
-- ─────────────────────────────────────────────────────────
INSERT INTO bot_flows (tenant_id, active, initial_message, followup_message)
VALUES
  ('11111111-0000-0000-0000-000000000001', true,
   'Olá {{nome}}, tudo bem? Sou da Construtora ABC e gostaria de apresentar nossas soluções.',
   'Olá {{nome}}, passando para verificar se recebeu minha mensagem anterior. Posso enviar mais detalhes?'),
  ('11111111-0000-0000-0000-000000000002', true,
   'Olá {{nome}}, sou da Fornecedor XYZ. Trabalhamos com suprimentos para empresas. Posso apresentar?',
   'Oi {{nome}}, seguindo nossa conversa anterior. Tem interesse em conhecer nossas condições?')
ON CONFLICT (tenant_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────
-- Conexão do agente (offline por padrão)
-- ─────────────────────────────────────────────────────────
INSERT INTO agent_connections (tenant_id, status)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'offline'),
  ('11111111-0000-0000-0000-000000000002', 'offline')
ON CONFLICT (tenant_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────
-- NOTA: Os usuários são criados via Supabase Auth
-- Após criar usuário pelo Auth, execute:
--
-- INSERT INTO users (id, tenant_id, name, email, tenant_role)
-- VALUES (
--   '<uuid-do-auth>',
--   '11111111-0000-0000-0000-000000000001',
--   'Ana Oliveira',
--   'pro@demo.com',
--   'gestor'
-- );
-- ─────────────────────────────────────────────────────────
