// ============================================================
// ROUTES
// ============================================================
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/cadastro',
  APP_DASHBOARD: '/app/dashboard',
  APP_CONTACTS: '/app/contatos',
  APP_CONTACT_DETAIL: '/app/contatos/:id',
  APP_PRODUCTS: '/app/produtos',
  APP_TEMPLATES: '/app/templates',
  APP_QUEUE: '/app/fila',
  APP_NOTIFICATIONS: '/app/notificacoes',
  APP_CRM: '/app/crm',
  APP_CLIENTS: '/app/clientes',
  APP_CLIENT_DETAIL: '/app/clientes/:id',
  APP_CLIENT_METRICS: '/app/metricas',
  APP_CAMPAIGNS: '/app/campanhas',
  APP_INSTAGRAM: '/app/instagram',
  APP_BOT: '/app/bot',
  APP_TEAM: '/app/equipe',
  APP_SUBSCRIPTION: '/app/assinatura',
  APP_SETTINGS: '/app/configuracoes',
  APP_WHATSAPP: '/app/whatsapp',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS: '/admin/usuarios',
  ADMIN_PLANS: '/admin/planos',
};

// ============================================================
// TEAM — Multi-usuário por empresa (tenant)
// ============================================================
export type TeamRole = 'gestor' | 'vendedor' | 'sdr';

export interface TeamMember {
  id: string;
  tenantId: string;       // empresa dona do plano
  name: string;
  email: string;
  phone?: string;
  role: TeamRole;
  avatarColor: string;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
  // Metas pessoais
  dailyGoal?: number;     // envios/dia
  monthlyGoal?: number;   // conversões/mês
}

export type ActivityType =
  | 'message_sent'        // enviou mensagem inicial
  | 'followup_sent'       // enviou follow-up
  | 'message_received'    // lead respondeu (registrado por quem viu)
  | 'status_changed'      // mudou status do contato
  | 'deal_created'        // criou deal no CRM
  | 'deal_moved'          // moveu deal de estágio
  | 'deal_won'            // fechou deal
  | 'deal_lost'           // perdeu deal
  | 'contact_added'       // cadastrou lead
  | 'contact_assigned'    // atribuiu lead a outro membro
  | 'note_added';         // adicionou nota

export interface ActivityLog {
  id: string;
  tenantId: string;
  memberId: string;       // quem fez a ação
  memberName: string;
  memberRole: TeamRole;
  type: ActivityType;
  contactId?: string;
  contactName?: string;
  contactCompany?: string;
  dealId?: string;
  dealName?: string;
  fromStage?: string;     // para deal_moved
  toStage?: string;
  note?: string;          // texto livre opcional
  createdAt: Date;
}

// ============================================================
// CAMPAIGN — Disparo em massa segmentado
// ============================================================
export type CampaignStatus = 'rascunho' | 'agendada' | 'enviando' | 'concluida' | 'pausada' | 'cancelada';
export type CampaignChannel = 'whatsapp' | 'instagram' | 'ambos';

export interface CampaignAudience {
  segments: string[];       // segmentos de contatos (ex: ['Arquitetura', 'Engenharia'])
  contactStatuses: string[]; // status dos contatos (ex: ['aguardando', 'followup'])
  tags: string[];
  productIds: string[];
  total: number;            // total de leads selecionados
}

export interface CampaignMetrics {
  total:      number;
  sent:       number;
  delivered:  number;
  read:       number;
  replied:    number;
  converted:  number;
  failed:     number;
  optOut:     number;
}

export interface Campaign {
  id: string;
  userId: string;
  name: string;
  description?: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  message: string;         // template com variáveis
  mediaUrl?: string;       // imagem/link opcional
  audience: CampaignAudience;
  metrics: CampaignMetrics;
  scheduledAt?: Date;
  startedAt?: Date;
  finishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// BOT — Regras de auto-resposta
// ============================================================
export type BotAction =
  | 'reply'          // responder com mensagem
  | 'mark_positive'  // marcar como resposta positiva
  | 'archive'        // arquivar contato
  | 'notify_team'    // notificar equipe comercial
  | 'add_tag'        // adicionar tag ao contato
  | 'escalate';      // passar para atendimento humano

export interface BotRule {
  id: string;
  userId: string;
  channel: CampaignChannel;
  name: string;
  isActive: boolean;
  priority: number;       // ordem de avaliação
  trigger: {
    type: 'keyword' | 'any_message' | 'no_reply_days' | 'sentiment';
    keywords?: string[];  // para tipo keyword
    days?: number;        // para no_reply_days
    matchAll?: boolean;   // AND vs OR nas keywords
  };
  action: BotAction;
  replyMessage?: string;   // se action = 'reply'
  notifyMessage?: string;  // mensagem para o time
  delaySeconds?: number;   // delay antes de agir
  createdAt: Date;
}

// CRM / Funil de Negociação
export type DealStage = 'contato' | 'qualificacao' | 'proposta' | 'negociacao' | 'fechado' | 'perdido';

export interface Deal {
  id: string;
  userId: string;
  contactId?: string;   // vinculado a contato existente (opcional)
  name: string;         // nome do lead / oportunidade
  company: string;
  phone: string;
  email?: string;
  stage: DealStage;
  value?: number;       // valor estimado da negociação
  notes?: string;
  productId?: string;
  productName?: string;
  createdAt: Date;
  updatedAt: Date;
  fromProspecting: boolean; // true = veio do funil de prospecção (convertido)
  // Atribuição de equipe
  assignedTo?: string;        // memberId responsável
  assignedToName?: string;
  assignedToColor?: string;
  // Timeline de atividades do deal
  timeline?: DealTimelineEvent[];
}

export const DEAL_STAGES: { id: DealStage; label: string; color: string; description: string }[] = [
  { id: 'contato',      label: 'Contato Feito',    color: '#6366f1', description: 'Primeiro contato estabelecido' },
  { id: 'qualificacao', label: 'Qualificando',      color: '#0ea5e9', description: 'Avaliando fit e necessidade' },
  { id: 'proposta',     label: 'Proposta Enviada',  color: '#f59e0b', description: 'Proposta comercial em análise' },
  { id: 'negociacao',   label: 'Negociando',        color: '#8b5cf6', description: 'Ajustes e negociação final' },
  { id: 'fechado',      label: 'Fechado ✓',         color: '#10b981', description: 'Negócio fechado com sucesso' },
  { id: 'perdido',      label: 'Perdido',            color: '#ef4444', description: 'Negócio não concluído' },
];

export const STAGE_PROBABILITY: Record<DealStage, number> = {
  contato: 10,
  qualificacao: 30,
  proposta: 60,
  negociacao: 80,
  fechado: 100,
  perdido: 0,
};

// ============================================================
// CUSTOMER (Cliente) — gerado quando deal é fechado
// ============================================================

export type ClientStatus = 'ativo' | 'inativo' | 'em_risco' | 'churned';

/** Pessoa de contato dentro da empresa cliente */
export interface ClientContact {
  id: string;
  name: string;
  role: string;         // ex: "Diretor Comercial", "Sócio"
  phone: string;
  email?: string;
  isPrimary: boolean;
  whatsapp?: string;
  notes?: string;
}

/** Proposta comercial anexada ao cliente */
export interface Proposal {
  id: string;
  title: string;
  value: number;
  status: 'rascunho' | 'enviada' | 'aprovada' | 'rejeitada' | 'expirada';
  sentAt?: Date;
  validUntil?: Date;
  fileUrl?: string;     // URL do arquivo (PDF simulado)
  fileName?: string;
  notes?: string;
  createdAt: Date;
}

/** Produto/serviço vendido ao cliente */
export interface ClientProduct {
  productId?: string;
  productName: string;
  quantity: number;
  unitValue: number;    // valor unitário
  totalValue: number;   // quantity * unitValue
  status: 'ativo' | 'pausado' | 'cancelado' | 'concluido';
  startDate: Date;
  endDate?: Date;
  renewalDate?: Date;
  notes?: string;
}

/** Interação / touchpoint com o cliente */
export interface ClientInteraction {
  id: string;
  type: 'reuniao' | 'ligacao' | 'whatsapp' | 'email' | 'visita' | 'proposta' | 'contrato' | 'nota';
  title: string;
  description?: string;
  date: Date;
  outcome?: 'positivo' | 'neutro' | 'negativo';
  createdBy?: string;
}

/** Cadastro completo do cliente */
export interface Client {
  id: string;
  userId: string;
  dealId?: string;        // deal de origem
  contactId?: string;     // contato de prospecção de origem

  // Dados da empresa
  companyName: string;
  cnpj?: string;
  segment: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  employeeCount?: string;  // "1-10", "11-50", etc.
  annualRevenue?: string;  // faixa de faturamento

  // Contatos (pessoas)
  contacts: ClientContact[];

  // Comercial
  status: ClientStatus;
  healthScore: number;     // 0-100 score calculado
  ltv: number;             // lifetime value acumulado
  mrr?: number;            // monthly recurring revenue
  acquisitionDate: Date;
  lastInteractionAt?: Date;
  nextFollowUpAt?: Date;

  // Produtos comprados
  products: ClientProduct[];

  // Propostas
  proposals: Proposal[];

  // Histórico de interações
  interactions: ClientInteraction[];

  // Origem
  fromProspecting: boolean;
  productName?: string;    // produto que originou a prospecção

  notes?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// TYPES
// ============================================================
export type PlanId = 'starter' | 'pro' | 'business';
export type UserRole = 'admin' | 'user';
export type TenantRole = 'gestor' | 'vendedor' | 'sdr';
export type ContactStatus = 'aguardando' | 'fila' | 'followup' | 'respondido' | 'convertido' | 'arquivado';
export type SubscriptionStatus = 'active' | 'trial' | 'cancelled' | 'past_due';
export type QueueStatus = 'pending' | 'sending' | 'sent' | 'failed' | 'skipped';

// Product / Offer
export interface Product {
  id: string;
  userId: string;
  name: string;
  description: string;
  category: string;
  color: string; // for visual display
  templates: {
    initial: string;
    followup_1: string;
    followup_2: string;
    followup_3: string;
  };
  createdAt: Date;
}

// Queue item (anti-blocking)
export interface QueueItem {
  id: string;
  contactId: string;
  contactName: string;
  contactPhone: string;
  contactCompany: string;
  messageType: 'initial' | 'followup_1' | 'followup_2' | 'followup_3';
  followUpNumber?: number;
  productId?: string;
  productName?: string;
  message: string;
  status: QueueStatus;
  scheduledAt: Date;
  sentAt?: Date;
  error?: string;
}

export interface SendSettings {
  messagesPerDay: number;      // max per day
  messagesPerHour: number;     // max per hour burst
  minDelaySeconds: number;     // min delay between msgs
  maxDelaySeconds: number;     // max delay (random)
  sendingHoursStart: number;   // e.g. 8 (8am)
  sendingHoursEnd: number;     // e.g. 20 (8pm)
  daysOfWeek: number[];        // 1-7, 1=Mon
  warmUpMode: boolean;         // gradual ramp for new numbers
}

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  maxContacts: number | null; // null = unlimited
  maxFollowUps: number;
  maxUsers: number | null;
  features: string[];
  highlight?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyName: string;
  planId: PlanId;
  subscriptionStatus: SubscriptionStatus;
  createdAt: Date;
  lastLoginAt: Date;
  contactsUsed: number;
  trialEndsAt?: Date;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantRole?: TenantRole;  // papel dentro da empresa
  tenantId?: string;        // empresa a que pertence
  companyName: string;
  planId: PlanId;
  subscriptionStatus: SubscriptionStatus;
  contactsUsed: number;
  avatarColor?: string;
}

export interface Message {
  id: string;
  type: 'sent' | 'received';
  content: string;
  timestamp: Date;
  status: 'pending' | 'sent' | 'delivered' | 'read';
  isFollowUp?: boolean;
  followUpNumber?: number;
  // Atribuição — quem enviou/registrou
  sentById?: string;
  sentByName?: string;
  sentByRole?: TenantRole;
  source?: 'bot' | 'human'; // bot = automático (sem nome); human = atendimento manual (exibe nome)
}

export interface Contact {
  id: string;
  userId: string;
  name: string;
  company: string;
  phone: string;
  city?: string;
  state?: string;
  segment?: string;
  email?: string;
  status: ContactStatus;
  productId?: string;       // which product to offer
  productName?: string;
  createdAt: Date;
  lastContactAt: Date | null;
  nextFollowUpAt: Date | null;
  followUpCount: number;
  maxFollowUps: number;
  messages: Message[];
  isPositiveResponse?: boolean;
  notes?: string;
  // Atribuição de responsável
  assignedTo?: string;      // memberId
  assignedToName?: string;
  assignedToColor?: string;
}

export interface Notification {
  id: string;
  contactId?: string;
  contactName?: string;
  contactCompany?: string;
  contactPhone?: string;
  type: 'positive_response' | 'followup_needed' | 'converted' | 'system_info' | 'system_success' | 'system_warning';
  title?: string;
  message: string;
  createdAt: Date;
  isRead: boolean;
}

export interface MessageTemplate {
  id: string;
  userId: string;
  name: string;
  type: 'initial' | 'followup_1' | 'followup_2' | 'followup_3' | 'followup_4' | 'followup_5';
  content: string;
  variables: string[];
}

// ============================================================
// DEAL — CRM com timeline de atribuição
// ============================================================
export interface DealTimelineEvent {
  id: string;
  memberId: string;
  memberName: string;
  memberRole: TenantRole;
  memberColor: string;
  type: ActivityType;
  description: string;
  fromStage?: string;
  toStage?: string;
  createdAt: Date;
}

// ============================================================
// PLANS CONFIG
// ============================================================
export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: 'starter',
    name: 'Essencial',
    price: 97.90,
    maxContacts: 300,
    maxFollowUps: 3,
    maxUsers: 2,
    features: [
      'Até 300 prospectos/mês',
      '3 follow-ups por contato',
      'Até 2 usuários',
      'Importação via Excel/CSV',
      'Templates de mensagem',
      'Dashboard de prospecção',
      'Alertas para equipe comercial',
      'Suporte por e-mail',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Ilimitado',
    price: 197.90,
    maxContacts: null,
    maxFollowUps: 5,
    maxUsers: null,
    highlight: true,
    features: [
      'Prospectos ilimitados',
      '5 follow-ups por contato',
      'Usuários ilimitados',
      'Importação Excel em lote',
      'Templates personalizados',
      'Dashboard avançado + métricas',
      'Alertas e atribuição comercial',
      'Relatórios exportáveis',
      'Suporte prioritário',
    ],
  },
  business: {
    id: 'business',
    name: 'Enterprise',
    price: 397,
    maxContacts: null,
    maxFollowUps: 10,
    maxUsers: null,
    features: [
      'Tudo do Ilimitado',
      'Até 10 follow-ups por contato',
      'API de integração',
      'Onboarding dedicado',
      'SLA de suporte',
      'Gerente de conta',
    ],
  },
};

// ============================================================
// STATUS LABELS & COLORS
// ============================================================
export const STATUS_LABELS: Record<ContactStatus, string> = {
  aguardando: 'Aguardando',
  fila: 'Na Fila',
  followup: 'Follow-up',
  respondido: 'Respondido',
  convertido: 'Convertido',
  arquivado: 'Arquivado',
};

export const STATUS_COLORS: Record<ContactStatus, { bg: string; text: string; border: string; dot: string }> = {
  aguardando: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: '#3b82f6' },
  fila: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', dot: '#0ea5e9' },
  followup: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: '#d97706' },
  respondido: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: '#7c3aed' },
  convertido: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: '#059669' },
  arquivado: { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200', dot: '#9ca3af' },
};

export const SUB_STATUS: Record<SubscriptionStatus, { label: string; color: string }> = {
  active: { label: 'Ativo', color: '#059669' },
  trial: { label: 'Trial', color: '#d97706' },
  cancelled: { label: 'Cancelado', color: '#dc2626' },
  past_due: { label: 'Inadimplente', color: '#dc2626' },
};

// ============================================================
// UTILS
// ============================================================
export function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return phone;
}

export function getWhatsAppLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/55${digits}?text=${encodeURIComponent(message)}`;
}

export function daysSince(date: Date | null): number {
  if (!date) return 0;
  return Math.floor((Date.now() - date.getTime()) / 86400000);
}

export function addDays(date: Date, days: number): Date {
  const r = new Date(date);
  r.setDate(r.getDate() + days);
  return r;
}

export function formatDate(date: Date | null): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

export function formatDateTime(date: Date | null): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function buildMessage(template: string, vars: Record<string, string>): string {
  return template.replace(/\[(\w+)\]/g, (_, k) => vars[k] || `[${k}]`);
}

export function getPlanUsagePercent(used: number, max: number | null): number {
  if (max === null) return 0;
  return Math.min(100, Math.round((used / max) * 100));
}
