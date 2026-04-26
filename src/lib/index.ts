// ===================== ROUTES =====================
export const ROUTE_PATHS = {
  HOME: '/',
  PROSPECTS: '/prospeccoes',
  PROSPECT_DETAIL: '/prospeccoes/:id',
  NOTIFICATIONS: '/notificacoes',
  TEMPLATES: '/modelos',
  SETTINGS: '/configuracoes',
};

// ===================== TYPES =====================
export type ProspectStatus = 'aguardando' | 'followup' | 'respondido' | 'convertido' | 'arquivado';

export interface Message {
  id: string;
  type: 'sent' | 'received';
  content: string;
  timestamp: Date;
  status: 'pending' | 'sent' | 'delivered' | 'read';
  isFollowUp?: boolean;
  followUpNumber?: number;
}

export interface Prospect {
  id: string;
  name: string;
  office: string;
  phone: string; // WhatsApp number
  city: string;
  state: string;
  specialization: string;
  email?: string;
  status: ProspectStatus;
  createdAt: Date;
  lastContactAt: Date | null;
  nextFollowUpAt: Date | null;
  followUpCount: number;
  maxFollowUps: number;
  messages: Message[];
  assignedTo?: string;
  notes?: string;
  isPositiveResponse?: boolean;
}

export interface Notification {
  id: string;
  prospectId: string;
  prospectName: string;
  prospectOffice: string;
  prospectPhone: string;
  type: 'positive_response' | 'followup_needed' | 'converted' | 'new_response';
  message: string;
  createdAt: Date;
  isRead: boolean;
  assignedTo?: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  type: 'initial' | 'followup_1' | 'followup_2' | 'followup_3';
  content: string;
  variables: string[];
}

export interface DashboardStats {
  totalProspects: number;
  awaiting: number;
  followUp: number;
  responded: number;
  converted: number;
  archived: number;
  responseRate: number;
  conversionRate: number;
  pendingFollowUps: number;
  positiveToday: number;
}

// ===================== UTILS =====================
export const STATUS_LABELS: Record<ProspectStatus, string> = {
  aguardando: 'Aguardando',
  followup: 'Follow-up',
  respondido: 'Respondido',
  convertido: 'Convertido',
  arquivado: 'Arquivado',
};

export const STATUS_COLORS: Record<ProspectStatus, { bg: string; text: string; border: string }> = {
  aguardando: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  followup: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  respondido: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  convertido: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  arquivado: { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200' },
};

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

export function getWhatsAppLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '');
  const encoded = encodeURIComponent(message);
  return `https://wa.me/55${digits}?text=${encoded}`;
}

export function daysSince(date: Date | null): number {
  if (!date) return 0;
  const diff = Date.now() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function daysUntil(date: Date | null): number {
  if (!date) return 0;
  const diff = date.getTime() - Date.now();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function formatDate(date: Date | null): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(date: Date | null): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function buildMessage(template: string, vars: Record<string, string>): string {
  return template.replace(/\[(\w+)\]/g, (_, key) => vars[key] || `[${key}]`);
}
