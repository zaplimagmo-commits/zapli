// ============================================================
// src/lib/supabase.ts — Cliente Supabase para o Zapli
//
// MULTI-TENANT:
//   Cada empresa (tenant) tem seus dados isolados via RLS.
//   O user_id do Supabase Auth é vinculado ao tenant_id.
//   Row Level Security garante que cada empresa só vê seus dados.
//
// USO:
//   import { supabase } from '@/lib/supabase'
//   const { data, error } = await supabase.from('contacts').select('*')
// ============================================================

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  console.warn('[Zapli] Supabase não configurado. Rodando em modo demo (dados locais).');
}

export const supabase = createClient<Database>(
  supabaseUrl  ?? 'https://placeholder.supabase.co',
  supabaseKey  ?? 'placeholder',
  {
    auth: {
      autoRefreshToken:    true,
      persistSession:      true,
      detectSessionInUrl:  true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

// ── db: cliente sem tipagem genérica — para queries dinâmicas ──
// Necessário porque os tipos de Insert/Update são derivados dinamicamente
// e o compilador não consegue inferir quando o schema ainda não foi gerado.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = supabase as any;

// ── Helper: verifica se Supabase está configurado ────────
export const IS_SUPABASE_CONFIGURED =
  !!import.meta.env.VITE_SUPABASE_URL &&
  !!import.meta.env.VITE_SUPABASE_ANON_KEY &&
  !import.meta.env.VITE_SUPABASE_URL.includes('placeholder');

// ── Helper: retorna o tenant_id do usuário logado ────────
export async function getCurrentTenantId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  return (data as { tenant_id: string } | null)?.tenant_id ?? null;
}

// ── Helper: tipagem das tabelas ──────────────────────────
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type Inserts<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type Updates<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
