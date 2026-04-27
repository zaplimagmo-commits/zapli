import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type {
  AuthUser, Contact, ContactStatus, Notification, MessageTemplate,
  Deal, DealStage, Client, ClientContact, ClientProduct, Proposal, ClientInteraction, ClientStatus,
  TeamMember, ActivityLog, ActivityType, DealTimelineEvent, TenantRole,
} from '@/lib/index';
import { addDays, buildMessage, PLANS } from '@/lib/index';
import { mockContacts, mockNotifications, defaultTemplates } from '@/data/index';
import { mockClients } from '@/data/clientData';

// ─── Auth Context ────────────────────────────────────────────
interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, _password: string) => boolean;
  logout: () => void;
  register: (name: string, email: string, password: string, company: string, planId: string) => boolean;
}

const MOCK_CREDENTIALS: Record<string, { password: string; user: AuthUser }> = {
  'admin@zapli.io': {
    password: 'admin123',
    user: { id: 'admin1', name: 'Admin Zapli', email: 'admin@zapli.io', role: 'admin', companyName: 'Zapli', planId: 'business', subscriptionStatus: 'active', contactsUsed: 0, avatarColor: '#ef4444' },
  },
  'starter@demo.com': {
    password: 'demo123',
    user: { id: 'u2', name: 'Carlos Souza', email: 'starter@demo.com', role: 'user', tenantRole: 'gestor', tenantId: 'tenant2', companyName: 'Fornecedor XYZ', planId: 'starter', subscriptionStatus: 'active', contactsUsed: 32, avatarColor: '#0ea5e9' },
  },
  'pro@demo.com': {
    password: 'demo123',
    user: { id: 'u1', name: 'Ana Oliveira', email: 'pro@demo.com', role: 'user', tenantRole: 'gestor', tenantId: 'tenant1', companyName: 'Construtora ABC', planId: 'pro', subscriptionStatus: 'active', contactsUsed: 87, avatarColor: '#6366f1' },
  },
  // Membros da equipe tenant1
  'joao@construtorabc.com': {
    password: 'demo123',
    user: { id: 'u_joao', name: 'João Pereira', email: 'joao@construtorabc.com', role: 'user', tenantRole: 'vendedor', tenantId: 'tenant1', companyName: 'Construtora ABC', planId: 'pro', subscriptionStatus: 'active', contactsUsed: 24, avatarColor: '#10b981' },
  },
  'mariana@construtorabc.com': {
    password: 'demo123',
    user: { id: 'u_mariana', name: 'Mariana Lima', email: 'mariana@construtorabc.com', role: 'user', tenantRole: 'sdr', tenantId: 'tenant1', companyName: 'Construtora ABC', planId: 'pro', subscriptionStatus: 'active', contactsUsed: 41, avatarColor: '#f59e0b' },
  },
  'rafael@construtorabc.com': {
    password: 'demo123',
    user: { id: 'u_rafael', name: 'Rafael Santos', email: 'rafael@construtorabc.com', role: 'user', tenantRole: 'vendedor', tenantId: 'tenant1', companyName: 'Construtora ABC', planId: 'pro', subscriptionStatus: 'active', contactsUsed: 18, avatarColor: '#8b5cf6' },
  },
};

const AuthContext = createContext<AuthContextType | null>(null);

// ─── Prospect Context ─────────────────────────────────────────
interface ProspectContextType {
  contacts: Contact[];
  notifications: Notification[];
  templates: MessageTemplate[];
  deals: Deal[];
  addContact: (data: Omit<Contact, 'id' | 'userId' | 'createdAt' | 'messages' | 'followUpCount' | 'status' | 'lastContactAt' | 'nextFollowUpAt' | 'maxFollowUps'>) => void;
  sendInitialMessage: (id: string, companyName: string) => { contact: Contact; message: string } | null;
  sendFollowUp: (id: string, companyName: string) => { contact: Contact; message: string } | null;
  markPositiveResponse: (id: string) => void;
  markConverted: (id: string) => void;
  updateStatus: (id: string, status: ContactStatus) => void;
  addMessage: (contactId: string, content: string, type: 'sent' | 'received', source?: 'bot' | 'human') => void;
  deleteContact: (id: string) => void;
  updateTemplate: (id: string, content: string, name: string) => void;
  markNotifRead: (id: string) => void;
  markAllNotifsRead: () => void;
  unreadCount: number;
  // CRM
  addDeal: (data: Omit<Deal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  moveDeal: (id: string, stage: DealStage) => void;
  updateDeal: (id: string, patch: Partial<Deal>) => void;
  deleteDeal: (id: string) => void;
  // Clients
  clients: Client[];
  addClient: (data: Omit<Client, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => string;
  updateClient: (id: string, patch: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  addClientContact: (clientId: string, contact: Omit<ClientContact, 'id'>) => void;
  removeClientContact: (clientId: string, contactId: string) => void;
  addProposal: (clientId: string, proposal: Omit<Proposal, 'id' | 'createdAt'>) => void;
  updateProposal: (clientId: string, proposalId: string, patch: Partial<Proposal>) => void;
  addInteraction: (clientId: string, interaction: Omit<ClientInteraction, 'id'>) => void;
  addClientProduct: (clientId: string, product: ClientProduct) => void;
  updateClientProduct: (clientId: string, idx: number, patch: Partial<ClientProduct>) => void;
  // Team
  teamMembers: TeamMember[];
  activityLog: ActivityLog[];
  addTeamMember: (data: Omit<TeamMember, 'id' | 'createdAt'>) => void;
  updateTeamMember: (id: string, patch: Partial<TeamMember>) => void;
  removeTeamMember: (id: string) => void;
  assignContact: (contactId: string, memberId: string, memberName: string, memberColor: string) => void;
  assignDeal: (dealId: string, memberId: string, memberName: string, memberColor: string) => void;
  addDealTimelineEvent: (dealId: string, event: Omit<DealTimelineEvent, 'id'>) => void;
  logActivity: (entry: Omit<ActivityLog, 'id'>) => void;
  addGestorNotification: (title: string, message: string, type?: 'system_info' | 'system_success' | 'system_warning') => void;
  stats: {
    total: number; aguardando: number; followup: number;
    respondido: number; convertido: number; arquivado: number;
    responseRate: number; conversionRate: number; positiveCount: number;
  };
}

const ProspectContext = createContext<ProspectContextType | null>(null);

// Mock deals pré-populados
const mockDeals: Deal[] = [
  {
    id: 'd1', userId: 'u1', contactId: 'c1', name: 'Roberto Fernandes', company: 'RF Engenharia',
    phone: '11987654321', email: 'roberto@rfeng.com.br', stage: 'negociacao', value: 85000,
    notes: 'Interesse em 3 obras no Morumbi. Reunião agendada para semana que vem.',
    createdAt: new Date(Date.now() - 3 * 86400000), updatedAt: new Date(Date.now() - 1 * 86400000),
    fromProspecting: true, productName: 'Parceria com Escritórios de Arquitetura',
    assignedTo: 'u_joao', assignedToName: 'João Pereira', assignedToColor: '#10b981',
    timeline: [
      { id: 'tl1', memberId: 'u_mariana', memberName: 'Mariana Lima', memberRole: 'sdr', memberColor: '#f59e0b', type: 'contact_added', description: 'Lead cadastrado e mensagem inicial enviada', createdAt: new Date(Date.now() - 8 * 86400000) },
      { id: 'tl2', memberId: 'u_mariana', memberName: 'Mariana Lima', memberRole: 'sdr', memberColor: '#f59e0b', type: 'deal_created', description: 'Lead convertido e deal criado no CRM', createdAt: new Date(Date.now() - 3 * 86400000) },
      { id: 'tl3', memberId: 'u_joao', memberName: 'João Pereira', memberRole: 'vendedor', memberColor: '#10b981', type: 'contact_assigned', description: 'Deal atribuído para João Pereira', createdAt: new Date(Date.now() - 3 * 86400000) },
      { id: 'tl4', memberId: 'u_joao', memberName: 'João Pereira', memberRole: 'vendedor', memberColor: '#10b981', type: 'deal_moved', description: 'Movido para Qualificando', fromStage: 'contato', toStage: 'qualificacao', createdAt: new Date(Date.now() - 2 * 86400000) },
      { id: 'tl5', memberId: 'u_joao', memberName: 'João Pereira', memberRole: 'vendedor', memberColor: '#10b981', type: 'deal_moved', description: 'Proposta enviada por e-mail. Aguardando retorno.', fromStage: 'qualificacao', toStage: 'proposta', createdAt: new Date(Date.now() - 2 * 86400000) },
      { id: 'tl6', memberId: 'u1', memberName: 'Ana Oliveira', memberRole: 'gestor', memberColor: '#6366f1', type: 'note_added', description: 'Cliente pediu desconto de 10%. Aprovado para fechar. Seguir com João.', createdAt: new Date(Date.now() - 1 * 86400000) },
      { id: 'tl7', memberId: 'u_joao', memberName: 'João Pereira', memberRole: 'vendedor', memberColor: '#10b981', type: 'deal_moved', description: 'Em negociação final. Reunião marcada.', fromStage: 'proposta', toStage: 'negociacao', createdAt: new Date(Date.now() - 1 * 86400000) },
    ],
  },
  {
    id: 'd2', userId: 'u1', name: 'Fernanda Castro', company: 'Castro & Associados',
    phone: '21976543210', stage: 'proposta', value: 42000,
    notes: 'Quer proposta de parceria mensal. Enviar orçamento até sexta.',
    createdAt: new Date(Date.now() - 2 * 86400000), updatedAt: new Date(Date.now() - 2 * 86400000),
    fromProspecting: true, assignedTo: 'u_rafael', assignedToName: 'Rafael Santos', assignedToColor: '#8b5cf6',
    timeline: [
      { id: 'tl8', memberId: 'u_mariana', memberName: 'Mariana Lima', memberRole: 'sdr', memberColor: '#f59e0b', type: 'deal_created', description: 'Lead qualificado pela Mariana e adicionado ao CRM', createdAt: new Date(Date.now() - 2 * 86400000) },
      { id: 'tl9', memberId: 'u_rafael', memberName: 'Rafael Santos', memberRole: 'vendedor', memberColor: '#8b5cf6', type: 'contact_assigned', description: 'Atribuído para Rafael — especialidade em projetos residenciais', createdAt: new Date(Date.now() - 2 * 86400000) },
      { id: 'tl10', memberId: 'u_rafael', memberName: 'Rafael Santos', memberRole: 'vendedor', memberColor: '#8b5cf6', type: 'deal_moved', description: 'Proposta enviada via WhatsApp. Lead solicitou reunião.', fromStage: 'contato', toStage: 'proposta', createdAt: new Date(Date.now() - 1 * 86400000) },
    ],
  },
];

// Mock equipe
const mockTeamMembers: TeamMember[] = [
  { id: 'u1',        tenantId: 'tenant1', name: 'Ana Oliveira',  email: 'pro@demo.com',               role: 'gestor',   avatarColor: '#6366f1', isActive: true, createdAt: new Date(Date.now() - 60 * 86400000), lastLoginAt: new Date(),                           dailyGoal: 60, monthlyGoal: 10 },
  { id: 'u_joao',    tenantId: 'tenant1', name: 'João Pereira',  email: 'joao@construtorabc.com',      role: 'vendedor', avatarColor: '#10b981', isActive: true, createdAt: new Date(Date.now() - 30 * 86400000), lastLoginAt: new Date(Date.now() - 2 * 3600000),   dailyGoal: 50, monthlyGoal: 8  },
  { id: 'u_mariana', tenantId: 'tenant1', name: 'Mariana Lima',  email: 'mariana@construtorabc.com',   role: 'sdr',      avatarColor: '#f59e0b', isActive: true, createdAt: new Date(Date.now() - 30 * 86400000), lastLoginAt: new Date(Date.now() - 1 * 3600000),   dailyGoal: 70, monthlyGoal: 5  },
  { id: 'u_rafael',  tenantId: 'tenant1', name: 'Rafael Santos', email: 'rafael@construtorabc.com',    role: 'vendedor', avatarColor: '#8b5cf6', isActive: true, createdAt: new Date(Date.now() - 15 * 86400000), lastLoginAt: new Date(Date.now() - 24 * 3600000),  dailyGoal: 45, monthlyGoal: 6  },
];

// Mock activity log global
const mockActivityLog: ActivityLog[] = [
  { id: 'al1',  tenantId: 'tenant1', memberId: 'u_mariana', memberName: 'Mariana Lima',  memberRole: 'sdr',      type: 'message_sent',    contactId: 'c1', contactName: 'Carlos Mendes',    contactCompany: 'CM Projetos',    createdAt: new Date(Date.now() - 10 * 60000) },
  { id: 'al2',  tenantId: 'tenant1', memberId: 'u_joao',    memberName: 'João Pereira',  memberRole: 'vendedor', type: 'deal_moved',       dealId: 'd1',    dealName: 'RF Engenharia',        fromStage: 'proposta', toStage: 'negociacao', note: 'Reunião marcada para sexta 14h', createdAt: new Date(Date.now() - 25 * 60000) },
  { id: 'al3',  tenantId: 'tenant1', memberId: 'u_mariana', memberName: 'Mariana Lima',  memberRole: 'sdr',      type: 'contact_added',   contactId: 'c2', contactName: 'Ana Beatriz Costa', contactCompany: 'AB Arquitetura', createdAt: new Date(Date.now() - 40 * 60000) },
  { id: 'al4',  tenantId: 'tenant1', memberId: 'u_rafael',  memberName: 'Rafael Santos', memberRole: 'vendedor', type: 'message_received', contactId: 'c3', contactName: 'Marcos Pereira',   contactCompany: 'MP Construtora', note: '"Quanto custa o pacote completo?"', createdAt: new Date(Date.now() - 55 * 60000) },
  { id: 'al5',  tenantId: 'tenant1', memberId: 'u1',        memberName: 'Ana Oliveira',  memberRole: 'gestor',   type: 'contact_assigned', contactId: 'd2', contactName: 'Fernanda Castro',  contactCompany: 'Castro & Assoc', note: 'Atribuído para Rafael', createdAt: new Date(Date.now() - 2 * 3600000) },
  { id: 'al6',  tenantId: 'tenant1', memberId: 'u_joao',    memberName: 'João Pereira',  memberRole: 'vendedor', type: 'deal_won',         dealId: 'dx',    dealName: 'Estrutura Plus',       note: 'Fechado R$28.000! 🎉',          createdAt: new Date(Date.now() - 1 * 86400000) },
  { id: 'al7',  tenantId: 'tenant1', memberId: 'u_mariana', memberName: 'Mariana Lima',  memberRole: 'sdr',      type: 'followup_sent',   contactId: 'c4', contactName: 'Paulo Roberto',    contactCompany: 'PR Engenharia',  createdAt: new Date(Date.now() - 1 * 86400000) },
  { id: 'al8',  tenantId: 'tenant1', memberId: 'u_rafael',  memberName: 'Rafael Santos', memberRole: 'vendedor', type: 'note_added',       dealId: 'd2',    dealName: 'Castro & Associados',  note: 'Cliente quer reunião presencial na próxima semana', createdAt: new Date(Date.now() - 1 * 86400000) },
];

// ─── Combined Provider ────────────────────────────────────────
export function AppProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [templates, setTemplates] = useState<MessageTemplate[]>(
    defaultTemplates.map(t => ({ ...t, userId: 'u1' }))
  );
  const [deals, setDeals] = useState<Deal[]>(mockDeals);
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>(mockActivityLog);

  // AUTH
  const login = useCallback((email: string, password: string): boolean => {
    const cred = MOCK_CREDENTIALS[email.toLowerCase()];
    if (cred && cred.password === password) { setAuthUser(cred.user); return true; }
    return false;
  }, []);

  const logout = useCallback(() => setAuthUser(null), []);

  const register = useCallback((name: string, email: string, _password: string, company: string, planId: string): boolean => {
    const newUser: AuthUser = {
      id: `u_${Date.now()}`, name, email, role: 'user',
      companyName: company, planId: planId as AuthUser['planId'],
      subscriptionStatus: 'trial', contactsUsed: 0,
    };
    MOCK_CREDENTIALS[email.toLowerCase()] = { password: _password, user: newUser };
    setAuthUser(newUser);
    return true;
  }, []);

  // CONTACTS
  const addContact = useCallback((data: Omit<Contact, 'id' | 'userId' | 'createdAt' | 'messages' | 'followUpCount' | 'status' | 'lastContactAt' | 'nextFollowUpAt' | 'maxFollowUps'>) => {
    const plan = PLANS[authUser?.planId ?? 'starter'];
    const newContact: Contact = {
      ...data, id: `c_${Date.now()}`, userId: authUser?.id ?? '',
      status: 'aguardando', createdAt: new Date(), lastContactAt: null,
      nextFollowUpAt: null, followUpCount: 0, maxFollowUps: plan.maxFollowUps,
      messages: [], isPositiveResponse: false,
    };
    setContacts(prev => [newContact, ...prev]);
  }, [authUser]);

  const sendInitialMessage = useCallback((id: string, companyName: string) => {
    const contact = contacts.find(c => c.id === id);
    if (!contact) return null;
    const tpl = templates.find(t => t.type === 'initial');
    if (!tpl) return null;
    const content = buildMessage(tpl.content, { Nome: contact.name.split(' ')[0], Empresa: companyName, EmpresaContato: contact.company });
    const msg = { id: `msg_${Date.now()}`, type: 'sent' as const, content, timestamp: new Date(), status: 'sent' as const };
    setContacts(prev => prev.map(c => c.id !== id ? c : {
      ...c, status: 'aguardando', lastContactAt: new Date(),
      nextFollowUpAt: addDays(new Date(), 3), messages: [...c.messages, msg],
    }));
    return { contact, message: content };
  }, [contacts, templates]);

  const sendFollowUp = useCallback((id: string, companyName: string) => {
    const contact = contacts.find(c => c.id === id);
    if (!contact || contact.followUpCount >= contact.maxFollowUps) return null;
    const num = contact.followUpCount + 1;
    const tplType = `followup_${num}` as MessageTemplate['type'];
    const tpl = templates.find(t => t.type === tplType) || templates.find(t => t.type === 'followup_1');
    if (!tpl) return null;
    const content = buildMessage(tpl.content, { Nome: contact.name.split(' ')[0], Empresa: companyName, EmpresaContato: contact.company });
    const msg = { id: `msg_${Date.now()}`, type: 'sent' as const, content, timestamp: new Date(), status: 'sent' as const, isFollowUp: true, followUpNumber: num };
    const newCount = num;
    const newStatus: ContactStatus = newCount >= contact.maxFollowUps ? 'arquivado' : 'followup';
    setContacts(prev => prev.map(c => c.id !== id ? c : {
      ...c, status: newStatus, lastContactAt: new Date(), followUpCount: newCount,
      nextFollowUpAt: newStatus === 'arquivado' ? null : addDays(new Date(), 3),
      messages: [...c.messages, msg],
    }));
    return { contact, message: content };
  }, [contacts, templates]);

  const markPositiveResponse = useCallback((id: string) => {
    const contact = contacts.find(c => c.id === id);
    if (!contact) return;
    setContacts(prev => prev.map(c => c.id !== id ? c : { ...c, status: 'respondido', isPositiveResponse: true, nextFollowUpAt: null }));
    setNotifications(prev => [{
      id: `n_${Date.now()}`, contactId: id, contactName: contact.name,
      contactCompany: contact.company, contactPhone: contact.phone,
      type: 'positive_response',
      message: `${contact.name} (${contact.company}) retornou positivamente. Encaminhar para comercial!`,
      createdAt: new Date(), isRead: false,
    }, ...prev]);
  }, [contacts]);

  const markConverted = useCallback((id: string) => {
    const contact = contacts.find(c => c.id === id);
    if (!contact) return;
    setContacts(prev => prev.map(c => c.id !== id ? c : { ...c, status: 'convertido' }));
    setNotifications(prev => [{
      id: `n_${Date.now()}`, contactId: id, contactName: contact.name,
      contactCompany: contact.company, contactPhone: contact.phone,
      type: 'converted',
      message: `${contact.name} (${contact.company}) foi convertido! 🎉 Adicionado ao CRM e Clientes.`,
      createdAt: new Date(), isRead: false,
    }, ...prev]);
    // Cria deal no CRM
    const newDeal: Deal = {
      id: `d_${Date.now()}`, userId: authUser?.id ?? 'u1',
      contactId: id, name: contact.name, company: contact.company,
      phone: contact.phone, email: contact.email,
      stage: 'contato', createdAt: new Date(), updatedAt: new Date(),
      fromProspecting: true, notes: contact.notes,
    };
    setDeals(prev => [newDeal, ...prev]);
    // Cria cliente automaticamente
    const clientId = `cl_${Date.now()}`;
    const newClient: Client = {
      id: clientId, userId: authUser?.id ?? 'u1',
      contactId: id,
      companyName: contact.company,
      segment: contact.segment || 'Não informado',
      city: contact.city, state: contact.state,
      contacts: [{
        id: `cc_${Date.now()}`,
        name: contact.name,
        role: 'Contato principal',
        phone: contact.phone,
        email: contact.email,
        isPrimary: true,
        whatsapp: contact.phone,
      }],
      status: 'ativo',
      healthScore: 70,
      ltv: 0,
      acquisitionDate: new Date(),
      fromProspecting: true,
      products: [], proposals: [], interactions: [],
      tags: ['novo-cliente'],
      notes: contact.notes,
      createdAt: new Date(), updatedAt: new Date(),
    };
    setClients(prev => [newClient, ...prev]);
  }, [contacts, authUser]);

  const updateStatus = useCallback((id: string, status: ContactStatus) => {
    setContacts(prev => prev.map(c => c.id !== id ? c : { ...c, status }));
  }, []);

  const addMessage = useCallback((contactId: string, content: string, type: 'sent' | 'received', source: 'bot' | 'human' = 'bot') => {
    const msgSource = type === 'received' ? 'human' : source;
    const msg = {
      id: `msg_${Date.now()}`,
      type, content,
      timestamp: new Date(),
      status: (type === 'sent' ? 'sent' : 'read') as 'sent' | 'read',
      source: msgSource,
      ...(msgSource === 'human' && type === 'sent' && authUser ? {
        sentById: authUser.id,
        sentByName: authUser.name,
        sentByRole: authUser.tenantRole,
      } : {}),
    };
    setContacts(prev => prev.map(c => {
      if (c.id !== contactId) return c;
      return { ...c, messages: [...c.messages, msg], lastContactAt: new Date(), ...(type === 'received' && !c.isPositiveResponse ? { status: 'respondido' as ContactStatus } : {}) };
    }));
    if (type === 'received') {
      const contact = contacts.find(c => c.id === contactId);
      if (contact) {
        setNotifications(prev => [{
          id: `n_${Date.now()}`, contactId, contactName: contact.name,
          contactCompany: contact.company, contactPhone: contact.phone,
          type: 'positive_response', message: `${contact.name} respondeu sua mensagem!`,
          createdAt: new Date(), isRead: false,
        }, ...prev]);
      }
    }
  }, [contacts, authUser]);

  // Notificação automática para o Gestor quando qualquer membro da equipe realiza uma ação
  const addGestorNotification = useCallback((title: string, message: string, type: 'system_info' | 'system_success' | 'system_warning' = 'system_info') => {
    const n: Notification = {
      id: `gn_${Date.now()}`,
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date(),
    };
    setNotifications(prev => [n, ...prev]);
  }, []);

  const deleteContact = useCallback((id: string) => {
    setContacts(prev => {
      const contact = prev.find(c => c.id === id);
      if (contact && authUser?.tenantRole && authUser.tenantRole !== 'gestor') {
        addGestorNotification(
          `Contato excluído por ${authUser.name}`,
          `"${contact.name}" (${contact.company}) foi removido dos contatos.`,
          'system_warning'
        );
      }
      return prev.filter(c => c.id !== id);
    });
  }, [authUser, addGestorNotification]);

  const updateTemplate = useCallback((id: string, content: string, name: string) => {
    setTemplates(prev => prev.map(t => t.id !== id ? t : { ...t, content, name }));
  }, []);

  const markNotifRead = useCallback((id: string) => setNotifications(prev => prev.map(n => n.id !== id ? n : { ...n, isRead: true })), []);
  const markAllNotifsRead = useCallback(() => setNotifications(prev => prev.map(n => ({ ...n, isRead: true }))), []);

  // CRM
  const addDeal = useCallback((data: Omit<Deal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const newDeal: Deal = { ...data, id: `d_${Date.now()}`, userId: authUser?.id ?? 'u1', createdAt: new Date(), updatedAt: new Date() };
    setDeals(prev => [newDeal, ...prev]);
  }, [authUser]);

  const moveDeal = useCallback((id: string, stage: DealStage) => {
    setDeals(prev => {
      const deal = prev.find(d => d.id === id);
      if (deal && authUser?.tenantRole && authUser.tenantRole !== 'gestor') {
        const stageLabels: Record<string, string> = { contato: 'Contato', qualificacao: 'Qualificação', proposta: 'Proposta', negociacao: 'Negociação', fechado: 'Fechado', perdido: 'Perdido' };
        addGestorNotification(
          `Deal movido por ${authUser.name}`,
          `"${deal.name}" (${deal.company}) foi movido para ${stageLabels[stage] ?? stage}.`,
          stage === 'fechado' ? 'system_success' : 'system_info'
        );
      }
      return prev.map(d => d.id !== id ? d : { ...d, stage, updatedAt: new Date() });
    });
  }, [authUser, addGestorNotification]);

  const updateDeal = useCallback((id: string, patch: Partial<Deal>) => {
    setDeals(prev => prev.map(d => d.id !== id ? d : { ...d, ...patch, updatedAt: new Date() }));
  }, []);

  const deleteDeal = useCallback((id: string) => setDeals(prev => prev.filter(d => d.id !== id)), []);

  // CLIENTS
  const addClient = useCallback((data: Omit<Client, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): string => {
    const id = `cl_${Date.now()}`;
    setClients(prev => [{ ...data, id, userId: authUser?.id ?? 'u1', createdAt: new Date(), updatedAt: new Date() }, ...prev]);
    return id;
  }, [authUser]);

  const updateClient = useCallback((id: string, patch: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id !== id ? c : { ...c, ...patch, updatedAt: new Date() }));
  }, []);

  const deleteClient = useCallback((id: string) => setClients(prev => prev.filter(c => c.id !== id)), []);

  const addClientContact = useCallback((clientId: string, contact: Omit<ClientContact, 'id'>) => {
    setClients(prev => prev.map(c => c.id !== clientId ? c : {
      ...c, contacts: [...c.contacts, { ...contact, id: `cc_${Date.now()}` }], updatedAt: new Date(),
    }));
  }, []);

  const removeClientContact = useCallback((clientId: string, contactId: string) => {
    setClients(prev => prev.map(c => c.id !== clientId ? c : {
      ...c, contacts: c.contacts.filter(ct => ct.id !== contactId), updatedAt: new Date(),
    }));
  }, []);

  const addProposal = useCallback((clientId: string, proposal: Omit<Proposal, 'id' | 'createdAt'>) => {
    const newP: Proposal = { ...proposal, id: `pr_${Date.now()}`, createdAt: new Date() };
    setClients(prev => prev.map(c => c.id !== clientId ? c : {
      ...c, proposals: [newP, ...c.proposals], updatedAt: new Date(),
    }));
  }, []);

  const updateProposal = useCallback((clientId: string, proposalId: string, patch: Partial<Proposal>) => {
    setClients(prev => prev.map(c => c.id !== clientId ? c : {
      ...c, proposals: c.proposals.map(p => p.id !== proposalId ? p : { ...p, ...patch }), updatedAt: new Date(),
    }));
  }, []);

  const addInteraction = useCallback((clientId: string, interaction: Omit<ClientInteraction, 'id'>) => {
    const newI: ClientInteraction = { ...interaction, id: `it_${Date.now()}` };
    setClients(prev => prev.map(c => c.id !== clientId ? c : {
      ...c, interactions: [newI, ...c.interactions], lastInteractionAt: new Date(), updatedAt: new Date(),
    }));
  }, []);

  const addClientProduct = useCallback((clientId: string, product: ClientProduct) => {
    setClients(prev => prev.map(c => c.id !== clientId ? c : {
      ...c, products: [...c.products, product],
      ltv: c.ltv + product.totalValue, updatedAt: new Date(),
    }));
  }, []);

  const updateClientProduct = useCallback((clientId: string, idx: number, patch: Partial<ClientProduct>) => {
    setClients(prev => prev.map(c => {
      if (c.id !== clientId) return c;
      const prods = c.products.map((p, i) => i !== idx ? p : { ...p, ...patch });
      return { ...c, products: prods, ltv: prods.filter(p => p.status !== 'cancelado').reduce((s, p) => s + p.totalValue, 0), updatedAt: new Date() };
    }));
  }, []);

  // TEAM
  const addTeamMember = useCallback((data: Omit<TeamMember, 'id' | 'createdAt'>) => {
    const id = `m_${Date.now()}`;
    const cred = { password: 'demo123', user: { id, name: data.name, email: data.email, role: 'user' as const, tenantRole: data.role, tenantId: data.tenantId, companyName: authUser?.companyName ?? '', planId: authUser?.planId ?? 'pro', subscriptionStatus: 'active' as const, contactsUsed: 0, avatarColor: data.avatarColor } };
    MOCK_CREDENTIALS[data.email.toLowerCase()] = cred;
    setTeamMembers(prev => [...prev, { ...data, id, createdAt: new Date() }]);
  }, [authUser]);

  const updateTeamMember = useCallback((id: string, patch: Partial<TeamMember>) => {
    setTeamMembers(prev => prev.map(m => m.id !== id ? m : { ...m, ...patch }));
  }, []);

  const removeTeamMember = useCallback((id: string) => {
    setTeamMembers(prev => prev.map(m => m.id !== id ? m : { ...m, isActive: false }));
  }, []);

  const assignContact = useCallback((contactId: string, memberId: string, memberName: string, memberColor: string) => {
    setContacts(prev => prev.map(c => c.id !== contactId ? c : { ...c, assignedTo: memberId, assignedToName: memberName, assignedToColor: memberColor }));
  }, []);

  const assignDeal = useCallback((dealId: string, memberId: string, memberName: string, memberColor: string) => {
    setDeals(prev => prev.map(d => d.id !== dealId ? d : { ...d, assignedTo: memberId, assignedToName: memberName, assignedToColor: memberColor, updatedAt: new Date() }));
  }, []);

  const addDealTimelineEvent = useCallback((dealId: string, event: Omit<DealTimelineEvent, 'id'>) => {
    const ev: DealTimelineEvent = { ...event, id: `tlev_${Date.now()}` };
    setDeals(prev => prev.map(d => d.id !== dealId ? d : { ...d, timeline: [...(d.timeline ?? []), ev], updatedAt: new Date() }));
  }, []);

  const logActivity = useCallback((entry: Omit<ActivityLog, 'id'>) => {
    setActivityLog(prev => [{ ...entry, id: `al_${Date.now()}` }, ...prev]);
  }, []);

  const userContacts = contacts.filter(c => c.userId === authUser?.id || authUser?.role === 'admin' || authUser?.tenantId === 'tenant1');
  const responded = userContacts.filter(c => ['respondido', 'convertido'].includes(c.status)).length;
  const contacted = userContacts.filter(c => c.messages.length > 0).length;
  const stats = {
    total: userContacts.length,
    aguardando: userContacts.filter(c => c.status === 'aguardando').length,
    followup: userContacts.filter(c => c.status === 'followup').length,
    respondido: userContacts.filter(c => c.status === 'respondido').length,
    convertido: userContacts.filter(c => c.status === 'convertido').length,
    arquivado: userContacts.filter(c => c.status === 'arquivado').length,
    responseRate: contacted > 0 ? Math.round((responded / contacted) * 100) : 0,
    conversionRate: userContacts.length > 0 ? Math.round((userContacts.filter(c => c.status === 'convertido').length / userContacts.length) * 100) : 0,
    positiveCount: userContacts.filter(c => c.isPositiveResponse).length,
  };

  // Apenas membros do mesmo tenant
  const tenantMembers = teamMembers.filter(m => m.tenantId === authUser?.tenantId || authUser?.role === 'admin');
  const tenantActivity = activityLog.filter(a => a.tenantId === authUser?.tenantId || authUser?.role === 'admin');

  const userDeals = deals.filter(d => d.userId === authUser?.id || authUser?.role === 'admin' || authUser?.tenantId === 'tenant1');
  const userClients = clients.filter(c => c.userId === authUser?.id || authUser?.role === 'admin' || authUser?.tenantId === 'tenant1');

  return (
    <AuthContext.Provider value={{ user: authUser, login, logout, register }}>
      <ProspectContext.Provider value={{
        contacts: userContacts, notifications, templates, deals: userDeals,
        clients: userClients,
        addContact, sendInitialMessage, sendFollowUp, markPositiveResponse,
        markConverted, updateStatus, addMessage, deleteContact, updateTemplate,
        markNotifRead, markAllNotifsRead,
        unreadCount: notifications.filter(n => !n.isRead).length,
        addDeal, moveDeal, updateDeal, deleteDeal,
        addClient, updateClient, deleteClient,
        addClientContact, removeClientContact,
        addProposal, updateProposal,
        addInteraction,
        addClientProduct, updateClientProduct,
        teamMembers: tenantMembers,
        activityLog: tenantActivity,
        addTeamMember, updateTeamMember, removeTeamMember,
        assignContact, assignDeal, addDealTimelineEvent, logActivity, addGestorNotification,
        stats,
      }}>
        {children}
      </ProspectContext.Provider>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AppProvider');
  return ctx;
}

export function useProspect() {
  const ctx = useContext(ProspectContext);
  if (!ctx) throw new Error('useProspect must be inside AppProvider');
  return ctx;
}
