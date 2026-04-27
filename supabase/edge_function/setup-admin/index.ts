import { createClient } from "npm:@supabase/supabase-js@2"

Deno.serve(async (req) => {
  // Security check - only allow with secret token
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== 'Bearer zapli-setup-2026') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const results: any = {}
  const TENANT_ID = '22222222-0000-0000-0000-000000000001'

  try {
    // 1. Delete existing users from public.users
    await supabaseAdmin.from('users')
      .delete()
      .in('email', ['zaplimagmo@gmail.com', 'magmodrive@gmail.com'])

    // 2. Get auth user IDs
    const { data: { users: authUsers } } = await supabaseAdmin.auth.admin.listUsers()
    const zapliUser = authUsers.find(u => u.email === 'zaplimagmo@gmail.com')
    const magmoUser = authUsers.find(u => u.email === 'magmodrive@gmail.com')

    results.zapli_found = !!zapliUser
    results.magmo_found = !!magmoUser

    // 3. Delete existing auth users
    if (zapliUser) {
      await supabaseAdmin.auth.admin.deleteUser(zapliUser.id)
      results.zapli_deleted = true
    }
    if (magmoUser) {
      await supabaseAdmin.auth.admin.deleteUser(magmoUser.id)
      results.magmo_deleted = true
    }

    // 4. Create tenant
    const { data: tenant, error: tenantError } = await supabaseAdmin.from('tenants')
      .upsert({
        id: TENANT_ID,
        name: 'Magmo Construção',
        slug: 'magmo-construcao',
        plan: 'pro',
        plan_status: 'active',
        trial_ends_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      }, { onConflict: 'id' })
      .select()
      .single()
    results.tenant = tenantError ? tenantError.message : 'criado'

    // 5. Create gestor user (zaplimagmo)
    const { data: newZapli, error: zapliError } = await supabaseAdmin.auth.admin.createUser({
      email: 'zaplimagmo@gmail.com',
      password: '123456',
      email_confirm: true
    })
    results.zaplimagmo = zapliError ? zapliError.message : 'criado'

    if (newZapli?.user) {
      const { error: profileError } = await supabaseAdmin.from('users').insert({
        id: newZapli.user.id,
        tenant_id: TENANT_ID,
        name: 'Gestor Magmo',
        email: 'zaplimagmo@gmail.com',
        tenant_role: 'gestor',
        system_role: 'user',
        active: true
      })
      results.zaplimagmo_profile = profileError ? profileError.message : 'perfil criado'
    }

    // 6. Create admin user (magmodrive)
    const { data: newMagmo, error: magmoError } = await supabaseAdmin.auth.admin.createUser({
      email: 'magmodrive@gmail.com',
      password: '123456',
      email_confirm: true
    })
    results.magmodrive = magmoError ? magmoError.message : 'criado'

    if (newMagmo?.user) {
      const { error: profileError } = await supabaseAdmin.from('users').insert({
        id: newMagmo.user.id,
        tenant_id: TENANT_ID,
        name: 'Administrador',
        email: 'magmodrive@gmail.com',
        tenant_role: 'gestor',
        system_role: 'admin',
        active: true
      })
      results.magmodrive_profile = profileError ? profileError.message : 'perfil criado'
    }

    // 7. Bot flow and agent connection
    await supabaseAdmin.from('bot_flows')
      .upsert({ tenant_id: TENANT_ID, active: true,
        initial_message: 'Olá {{nome}}, sou da Magmo Construção. Posso apresentar nossas soluções?',
        followup_message: 'Olá {{nome}}, retornando nossa conversa. Posso enviar mais detalhes?' },
        { onConflict: 'tenant_id' })

    await supabaseAdmin.from('agent_connections')
      .upsert({ tenant_id: TENANT_ID, status: 'offline' }, { onConflict: 'tenant_id' })

    results.success = true
    results.message = 'Setup concluído com sucesso!'

  } catch (error: any) {
    results.error = error.message
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { 'Content-Type': 'application/json' }
  })
})
