-- ============================================================
-- Zapli — Migration 003: Setup Usuários Administrador e Gestor
-- URL: https://ohhawgidwrvlpiiasytp.supabase.co
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================================

-- ─────────────────────────────────────────────────────────
-- PASSO 1: Confirmar e ajustar usuários no auth.users
-- ─────────────────────────────────────────────────────────

-- Confirmar e-mail do zaplimagmo@gmail.com (caso não confirmado)
UPDATE auth.users
SET
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  confirmation_token = '',
  updated_at = NOW()
WHERE email = 'zaplimagmo@gmail.com';

-- Confirmar e-mail do magmodrive@gmail.com (caso não confirmado)
UPDATE auth.users
SET
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  confirmation_token = '',
  updated_at = NOW()
WHERE email = 'magmodrive@gmail.com';

-- ─────────────────────────────────────────────────────────
-- PASSO 2: Criar tenant "Magmo Construção" (se não existir)
-- ─────────────────────────────────────────────────────────
INSERT INTO tenants (id, name, slug, plan, plan_status, trial_ends_at)
VALUES (
  '22222222-0000-0000-0000-000000000001',
  'Magmo Construção',
  'magmo-construcao',
  'pro',
  'active',
  NOW() + INTERVAL '365 days'
)
ON CONFLICT (id) DO UPDATE SET
  name        = EXCLUDED.name,
  slug        = EXCLUDED.slug,
  plan        = EXCLUDED.plan,
  plan_status = EXCLUDED.plan_status,
  updated_at  = NOW();

-- ─────────────────────────────────────────────────────────
-- PASSO 3: Remover perfis antigos em public.users (se existirem)
-- ─────────────────────────────────────────────────────────
DELETE FROM public.users
WHERE email IN ('zaplimagmo@gmail.com', 'magmodrive@gmail.com');

-- ─────────────────────────────────────────────────────────
-- PASSO 4: Inserir perfis em public.users com roles corretos
-- ─────────────────────────────────────────────────────────

-- Usuário GESTOR da empresa Magmo Construção
INSERT INTO public.users (id, tenant_id, name, email, tenant_role, system_role, active)
SELECT
  au.id,
  '22222222-0000-0000-0000-000000000001',
  'Gestor Magmo',
  'zaplimagmo@gmail.com',
  'gestor',
  'user',
  true
FROM auth.users au
WHERE au.email = 'zaplimagmo@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  tenant_id   = EXCLUDED.tenant_id,
  name        = EXCLUDED.name,
  tenant_role = EXCLUDED.tenant_role,
  system_role = EXCLUDED.system_role,
  active      = EXCLUDED.active,
  updated_at  = NOW();

-- Usuário ADMINISTRADOR do sistema
INSERT INTO public.users (id, tenant_id, name, email, tenant_role, system_role, active)
SELECT
  au.id,
  '22222222-0000-0000-0000-000000000001',
  'Administrador Magmo',
  'magmodrive@gmail.com',
  'gestor',
  'admin',
  true
FROM auth.users au
WHERE au.email = 'magmodrive@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  tenant_id   = EXCLUDED.tenant_id,
  name        = EXCLUDED.name,
  tenant_role = EXCLUDED.tenant_role,
  system_role = EXCLUDED.system_role,
  active      = EXCLUDED.active,
  updated_at  = NOW();

-- ─────────────────────────────────────────────────────────
-- PASSO 5: Criar configuração de bot para o tenant
-- ─────────────────────────────────────────────────────────
INSERT INTO bot_flows (tenant_id, active, initial_message, followup_message)
VALUES (
  '22222222-0000-0000-0000-000000000001',
  true,
  'Olá {{nome}}, tudo bem? Sou da Magmo Construção e gostaria de apresentar nossas soluções.',
  'Olá {{nome}}, passando para verificar se recebeu minha mensagem anterior. Posso enviar mais detalhes?'
)
ON CONFLICT (tenant_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────
-- PASSO 6: Criar conexão do agente para o tenant
-- ─────────────────────────────────────────────────────────
INSERT INTO agent_connections (tenant_id, status)
VALUES ('22222222-0000-0000-0000-000000000001', 'offline')
ON CONFLICT (tenant_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────
-- VERIFICAÇÃO FINAL
-- ─────────────────────────────────────────────────────────
SELECT
  au.email,
  au.email_confirmed_at IS NOT NULL AS email_confirmado,
  pu.tenant_role,
  pu.system_role,
  t.name AS empresa
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
LEFT JOIN tenants t ON t.id = pu.tenant_id
WHERE au.email IN ('zaplimagmo@gmail.com', 'magmodrive@gmail.com')
ORDER BY au.email;
