// ============================================================
// src/lib/database.types.ts — Tipos TypeScript do banco Supabase
//
// Espelha EXATAMENTE a estrutura das tabelas no Supabase.
// Quando rodar `supabase gen types typescript`, este arquivo
// será gerado automaticamente. Por enquanto é manual.
//
// TABELAS:
//   tenants            → empresas cadastradas no Zapli
//   users              → usuários (gestor, vendedor, sdr)
//   contacts           → leads/contatos de WhatsApp
//   messages           → mensagens trocadas
//   campaigns          → campanhas de prospecção
//   deals              → negócios no CRM
//   clients            → clientes fechados
//   notifications      → notificações do sistema
//   agent_connections  → status do Zapli Agent por empresa
//   bot_flows          → configuração do bot por empresa
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {

      // ── Tenants (Empresas) ────────────────────────────
      tenants: {
        Row: {
          id:          string;           // UUID
          name:        string;           // "Construtora ABC"
          slug:        string;           // "construtora-abc" (único)
          plan:        TenantPlan;       // starter | pro | enterprise
          plan_status: PlanStatus;       // active | trial | suspended
          trial_ends_at: string | null;  // ISO date
          created_at:  string;
          updated_at:  string;
        };
        Insert: Omit<Database['public']['Tables']['tenants']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['tenants']['Insert']>;
      };

      // ── Users (Usuários de cada empresa) ─────────────
      users: {
        Row: {
          id:           string;          // UUID — mesmo ID do auth.users
          tenant_id:    string;          // FK → tenants.id
          name:         string;          // "Ana Oliveira"
          email:        string;
          tenant_role:  TenantRole;      // gestor | vendedor | sdr
          system_role:  SystemRole;      // admin | user
          avatar_url:   string | null;
          phone:        string | null;
          active:       boolean;
          created_at:   string;
          updated_at:   string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };

      // ── Contacts (Leads / Prospectos) ─────────────────
      contacts: {
        Row: {
          id:           string;
          tenant_id:    string;
          name:         string;
          phone:        string;          // "5511999990001" (com DDI)
          company:      string | null;
          email:        string | null;
          status:       ContactStatus;   // novo | em_contato | positivo | convertido | nao_interessado
          stage:        ContactStage;    // prospecting | contacted | qualified | proposal | closed
          assigned_to:  string | null;   // FK → users.id
          notes:        string | null;
          tags:         string[];
          source:       string | null;   // "campanha-jul", "indicação", etc.
          last_message_at: string | null;
          created_at:   string;
          updated_at:   string;
        };
        Insert: Omit<Database['public']['Tables']['contacts']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['contacts']['Insert']>;
      };

      // ── Messages (Histórico de mensagens) ─────────────
      messages: {
        Row: {
          id:           string;
          tenant_id:    string;
          contact_id:   string;          // FK → contacts.id
          content:      string;
          direction:    MessageDirection; // sent | received
          source:       MessageSource;   // bot | human
          sent_by:      string | null;   // FK → users.id (null = bot)
          sent_by_name: string | null;   // "Mariana Lima"
          sent_by_role: TenantRole | null;
          status:       MessageStatus;   // pending | sent | delivered | read | failed
          whatsapp_id:  string | null;   // ID real da mensagem no WhatsApp
          created_at:   string;
        };
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
      };

      // ── Campaigns (Campanhas de prospecção) ───────────
      campaigns: {
        Row: {
          id:             string;
          tenant_id:      string;
          name:           string;        // "Campanha Julho 2026"
          message:        string;        // Texto com variáveis {{nome}}, {{empresa}}
          status:         CampaignStatus; // draft | scheduled | running | paused | completed
          contacts_count: number;
          sent_count:     number;
          failed_count:   number;
          scheduled_at:   string | null; // ISO datetime
          completed_at:   string | null;
          created_by:     string | null; // FK → users.id
          created_at:     string;
          updated_at:     string;
        };
        Insert: Omit<Database['public']['Tables']['campaigns']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['campaigns']['Insert']>;
      };

      // ── Deals (CRM — Negócios) ─────────────────────────
      deals: {
        Row: {
          id:           string;
          tenant_id:    string;
          contact_id:   string | null;   // FK → contacts.id
          title:        string;
          value:        number;          // valor em reais
          stage:        DealStage;       // lead | qualified | proposal | negotiation | closed_won | closed_lost
          probability:  number;          // 0–100
          expected_close: string | null; // ISO date
          assigned_to:  string | null;   // FK → users.id
          notes:        string | null;
          created_at:   string;
          updated_at:   string;
        };
        Insert: Omit<Database['public']['Tables']['deals']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['deals']['Insert']>;
      };

      // ── Clients (Clientes fechados) ────────────────────
      clients: {
        Row: {
          id:           string;
          tenant_id:    string;
          name:         string;
          company:      string | null;
          phone:        string | null;
          email:        string | null;
          plan:         string | null;   // plano do cliente no nosso produto
          mrr:          number;          // receita mensal recorrente
          status:       ClientStatus;    // ativo | pausado | cancelado
          start_date:   string | null;
          notes:        string | null;
          created_at:   string;
          updated_at:   string;
        };
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['clients']['Insert']>;
      };

      // ── Notifications ──────────────────────────────────
      notifications: {
        Row: {
          id:           string;
          tenant_id:    string;
          user_id:      string | null;   // null = todos os gestores
          title:        string | null;
          message:      string;
          type:         NotificationType;
          contact_id:   string | null;
          contact_name: string | null;
          read:         boolean;
          created_at:   string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };

      // ── Agent Connections (Status do Zapli Agent) ──────
      agent_connections: {
        Row: {
          id:            string;
          tenant_id:     string;         // UNIQUE — uma conexão por empresa
          status:        AgentStatus;    // offline | online | connecting | connected | sleeping
          device_type:   string | null;  // mobile | desktop
          device_name:   string | null;  // "Android", "Windows"
          profile_name:  string | null;  // nome no WhatsApp
          profile_phone: string | null;  // número conectado
          connected_at:  string | null;
          last_seen:     string | null;
          sent_today:    number;
          sent_total:    number;
          agent_version: string | null;
          updated_at:    string;
        };
        Insert: Omit<Database['public']['Tables']['agent_connections']['Row'], 'id' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['agent_connections']['Insert']>;
      };

      // ── Bot Flows (Configuração do Bot) ────────────────
      bot_flows: {
        Row: {
          id:               string;
          tenant_id:        string;      // UNIQUE
          active:           boolean;
          initial_message:  string;      // mensagem de prospecção
          followup_message: string;      // follow-up após X dias
          followup_days:    number;      // padrão: 3
          positive_keywords: string[];   // ["interesse", "quanto", "valor"]
          negative_keywords: string[];   // ["não quero", "remove", "para"]
          daily_limit:      number;      // máx msgs/dia
          min_delay_seconds: number;     // delay mínimo entre msgs
          max_delay_seconds: number;     // delay máximo
          send_days:        number[];    // [1,2,3,4,5] = seg a sex
          send_hour_start:  number;      // 8 (08:00)
          send_hour_end:    number;      // 18 (18:00)
          updated_at:       string;
        };
        Insert: Omit<Database['public']['Tables']['bot_flows']['Row'], 'id' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['bot_flows']['Insert']>;
      };

    };

    Views:    Record<string, never>;
    Functions: Record<string, never>;
    Enums:    Record<string, never>;
  };
}

// ── Enums / tipos de domínio ─────────────────────────────

export type TenantPlan    = 'starter' | 'pro' | 'enterprise';
export type PlanStatus    = 'active' | 'trial' | 'suspended' | 'cancelled';
export type TenantRole    = 'gestor' | 'vendedor' | 'sdr';
export type SystemRole    = 'admin' | 'user';

export type ContactStatus = 'novo' | 'em_contato' | 'positivo' | 'convertido' | 'nao_interessado';
export type ContactStage  = 'prospecting' | 'contacted' | 'qualified' | 'proposal' | 'closed';

export type MessageDirection = 'sent' | 'received';
export type MessageSource    = 'bot' | 'human';
export type MessageStatus    = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export type CampaignStatus = 'draft' | 'scheduled' | 'running' | 'paused' | 'completed';

export type DealStage =
  | 'lead'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost';

export type ClientStatus = 'ativo' | 'pausado' | 'cancelado';

export type NotificationType =
  | 'positive_response'
  | 'followup_needed'
  | 'converted'
  | 'system_info'
  | 'system_success'
  | 'system_warning';

export type AgentStatus =
  | 'offline'
  | 'online'
  | 'connecting'
  | 'connected'
  | 'sleeping';
