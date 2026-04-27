-- ============================================================
-- Zapli — Migration 003b: Função temporária setup admin
-- Execute no SQL Editor OU será chamada via API após deploy
-- ============================================================

-- Função SECURITY DEFINER para configurar usuários admin
-- (bypassa RLS - executa como owner da função)
CREATE OR REPLACE FUNCTION public.zapli_setup_initial_users()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_tenant_id UUID := '22222222-0000-0000-0000-000000000001';
  v_zapli_id  UUID;
  v_magmo_id  UUID;
  v_result    jsonb;
BEGIN
  -- Buscar IDs dos usuários no auth
  SELECT id INTO v_zapli_id FROM auth.users WHERE email = 'zaplimagmo@gmail.com';
  SELECT id INTO v_magmo_id FROM auth.users WHERE email = 'magmodrive@gmail.com';

  -- Confirmar e-mails se não confirmados
  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      confirmation_token = '',
      updated_at = NOW()
  WHERE email IN ('zaplimagmo@gmail.com', 'magmodrive@gmail.com');

  -- Criar tenant Magmo Construção
  INSERT INTO public.tenants (id, name, slug, plan, plan_status, trial_ends_at)
  VALUES (v_tenant_id, 'Magmo Construção', 'magmo-construcao', 'pro', 'active', NOW() + INTERVAL '365 days')
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, plan = EXCLUDED.plan, plan_status = EXCLUDED.plan_status, updated_at = NOW();

  -- Remover perfis antigos
  DELETE FROM public.users WHERE email IN ('zaplimagmo@gmail.com', 'magmodrive@gmail.com');

  -- Inserir gestor (zaplimagmo)
  IF v_zapli_id IS NOT NULL THEN
    INSERT INTO public.users (id, tenant_id, name, email, tenant_role, system_role, active)
    VALUES (v_zapli_id, v_tenant_id, 'Gestor Magmo', 'zaplimagmo@gmail.com', 'gestor', 'user', true)
    ON CONFLICT (id) DO UPDATE SET tenant_id=EXCLUDED.tenant_id, tenant_role=EXCLUDED.tenant_role, system_role=EXCLUDED.system_role, updated_at=NOW();
  END IF;

  -- Inserir admin (magmodrive)
  IF v_magmo_id IS NOT NULL THEN
    INSERT INTO public.users (id, tenant_id, name, email, tenant_role, system_role, active)
    VALUES (v_magmo_id, v_tenant_id, 'Administrador', 'magmodrive@gmail.com', 'gestor', 'admin', true)
    ON CONFLICT (id) DO UPDATE SET tenant_id=EXCLUDED.tenant_id, tenant_role=EXCLUDED.tenant_role, system_role=EXCLUDED.system_role, updated_at=NOW();
  END IF;

  -- Criar bot_flow e agent_connection
  INSERT INTO public.bot_flows (tenant_id, active, initial_message, followup_message)
  VALUES (v_tenant_id, true,
    'Olá {{nome}}, sou da Magmo Construção. Posso apresentar nossas soluções?',
    'Olá {{nome}}, retornando nossa conversa. Posso enviar mais detalhes?')
  ON CONFLICT (tenant_id) DO NOTHING;

  INSERT INTO public.agent_connections (tenant_id, status)
  VALUES (v_tenant_id, 'offline')
  ON CONFLICT (tenant_id) DO NOTHING;

  v_result := jsonb_build_object(
    'success', true,
    'tenant_id', v_tenant_id,
    'zaplimagmo_id', v_zapli_id,
    'magmodrive_id', v_magmo_id,
    'message', 'Usuários configurados com sucesso'
  );

  RETURN v_result;
END;
$$;

-- Garantir que qualquer usuário autenticado possa chamar esta função
GRANT EXECUTE ON FUNCTION public.zapli_setup_initial_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.zapli_setup_initial_users() TO anon;
