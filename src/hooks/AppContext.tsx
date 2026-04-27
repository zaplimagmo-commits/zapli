import {
  createContext, useContext, useState, useCallback, useEffect,
  type ReactNode,
} from 'react';
import { supabase, db } from '@/lib/supabase';
import type {
  AuthUser, Contact, ContactStatus, Notification, MessageTemplate,
  Deal, DealStage, Client, ClientContact, ClientProduct, Proposal,
  ClientInteraction, TeamMember, ActivityLog, DealTimelineEvent,
} from '@/lib/index';
import { addDays, buildMessage, PLANS } from '@/lib/index';
import { defaultTemplates } from '@/data/index';

// ─── AuthContext ──────────────────────────────────────────────────────────────
interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string, company: string, planId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ─── ProspectContext ──────────────────────────────────────────────────────────
interface ProspectContextType {
  contacts: Contact[];
  notifications: Notification[];
  templates: MessageTemplate[];
  deals: Deal[];
  clients: Client[];
  teamMembers: TeamMember[];
  activityLog: ActivityLog[];
  dataLoading: boolean;
  addContact: (data: Omit<Contact, 'id' | 'userId' | 'createdAt' | 'messages' | 'followUpCount' | 'status' | 'lastContactAt' | 'nextFollowUpAt' | 'maxFollowUps'>) => Promise<void>;
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
  addDeal: (data: Omit<Deal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  moveDeal: (id: string, stage: DealStage) => void;
  updateDeal: (id: string, patch: Partial<Deal>) => void;
  deleteDeal: (id: string) => void;
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

// ─── Helper: mapeia row do Supabase → Contact local ──────────────────────────
function rowToContact(row: Record<string, unknown>): Contact {
  return {
    id: row.id as string,
    userId: (row.tenant_id as string) ?? '',
    name: row.name as string,
    phone: row.phone as string,
    company: (row.company as string) ?? '',
    email: (row.email as string) ?? '',
    status: ((row.status as string) ?? 'aguardando') as ContactStatus,
    createdAt: new Date(row.created_at as string),
    lastContactAt: row.last_message_at ? new Date(row.last_message_at as string) : null,
    nextFollowUpAt: null,
    followUpCount: 0,
    maxFollowUps: 3,
    messages: [],
    isPositiveResponse: (row.status as string) === 'respondido',
    notes: (row.notes as string) ?? '',
    segment: '',
    city: '',
    state: '',
    assignedTo: (row.assigned_to as string) ?? undefined,
  };
}

// ─── AppProvider ─────────────────────────────────────────────────────────────
export function AppProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  // Data state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>(
    defaultTemplates.map(t => ({ ...t, userId: '' }))
  );
  const [deals, setDeals] = useState<Deal[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);

  // ── Watch Supabase Auth session ─────────────────────────────────────────────
  useEffect(() => {
    // Get existing session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await loadUserProfile(session.user.id);
      }
      setAuthLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await loadUserProfile(session.user.id);
      } else {
        setAuthUser(null);
        setContacts([]);
        setDeals([]);
        setClients([]);
        setNotifications([]);
        setTeamMembers([]);
        setActivityLog([]);
      }
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load profile + tenant data after login
  async function loadUserProfile(userId: string) {
    const { data: profile } = await db
      .from('users')
      .select('*, tenants(*)')
      .eq('id', userId)
      .single();

    if (!profile) return;

    const tenant = (profile as Record<string, unknown>).tenants as Record<string, unknown> | null;

    const user: AuthUser = {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: (profile.system_role as 'admin' | 'user') ?? 'user',
      tenantRole: (profile.tenant_role as 'gestor' | 'vendedor' | 'sdr') ?? 'vendedor',
      tenantId: profile.tenant_id ?? undefined,
      companyName: (tenant?.name as string) ?? '',
      planId: ((tenant?.plan as string) ?? 'starter') as AuthUser['planId'],
      subscriptionStatus: ((tenant?.plan_status as string) === 'active' ? 'active' : 'trial') as AuthUser['subscriptionStatus'],
      contactsUsed: 0,
      avatarColor: '#6366f1',
    };

    setAuthUser(user);
    if (profile.tenant_id) {
      await loadTenantData(profile.tenant_id);
    }
  }

  // Load all tenant data from Supabase
  async function loadTenantData(tenantId: string) {
    setDataLoading(true);
    try {
      const [
        { data: contactRows },
        { data: dealRows },
        { data: clientRows },
        { data: notifRows },
        { data: memberRows },
      ] = await Promise.all([
        db.from('contacts').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
        db.from('deals').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
        db.from('clients').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
        db.from('notifications').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(50),
        db.from('users').select('*').eq('tenant_id', tenantId),
      ]);

      if (contactRows) setContacts((contactRows as Record<string, unknown>[]).map(rowToContact));

      if (dealRows) {
        setDeals((dealRows as Record<string, unknown>[]).map(row => ({
          id: row.id as string,
          userId: (row.tenant_id as string) ?? '',
          contactId: (row.contact_id as string) ?? undefined,
          name: (row.title as string) ?? '',
          company: '',
          phone: '',
          stage: (row.stage as DealStage) ?? 'contato',
          value: Number(row.value) ?? 0,
          notes: (row.notes as string) ?? '',
          createdAt: new Date(row.created_at as string),
          updatedAt: new Date(row.updated_at as string),
          fromProspecting: false,
          assignedTo: (row.assigned_to as string) ?? undefined,
          timeline: [] as DealTimelineEvent[],
        })));
      }

      if (clientRows) {
        setClients((clientRows as Record<string, unknown>[]).map(row => ({
          id: row.id as string,
          userId: (row.tenant_id as string) ?? '',
          companyName: (row.company as string) ?? (row.name as string) ?? '',
          segment: '',
          contacts: [{
            id: `cc_${row.id}`,
            name: (row.name as string) ?? '',
            role: 'Contato principal',
            phone: (row.phone as string) ?? '',
            email: (row.email as string) ?? '',
            isPrimary: true,
            whatsapp: (row.phone as string) ?? '',
          }],
          status: ((row.status as string) ?? 'ativo') as Client['status'],
          healthScore: 70,
          ltv: (Number(row.mrr) || 0) * 12,
          acquisitionDate: new Date(row.created_at as string),
          fromProspecting: false,
          products: [] as ClientProduct[],
          proposals: [] as Proposal[],
          interactions: [] as ClientInteraction[],
          tags: [] as string[],
          notes: (row.notes as string) ?? '',
          createdAt: new Date(row.created_at as string),
          updatedAt: new Date(row.updated_at as string),
        })));
      }

      if (notifRows) {
        setNotifications((notifRows as Record<string, unknown>[]).map(row => ({
          id: row.id as string,
          contactId: (row.contact_id as string) ?? undefined,
          contactName: (row.contact_name as string) ?? '',
          contactCompany: '',
          contactPhone: '',
          type: (row.type as Notification['type']) ?? 'system_info',
          title: (row.title as string) ?? undefined,
          message: row.message as string,
          createdAt: new Date(row.created_at as string),
          isRead: (row.read as boolean) ?? false,
        })));
      }

      if (memberRows) {
        setTeamMembers((memberRows as Record<string, unknown>[]).map(row => ({
          id: row.id as string,
          tenantId: (row.tenant_id as string) ?? '',
          name: row.name as string,
          email: row.email as string,
          role: (row.tenant_role as TeamMember['role']) ?? 'vendedor',
          avatarColor: (row.avatar_color as string) ?? '#6366f1',
          isActive: (row.active as boolean) ?? true,
          createdAt: new Date(row.created_at as string),
          lastLoginAt: undefined as Date | undefined,
          dailyGoal: 50,
          monthlyGoal: 8,
        })));
      }
    } catch (err) {
      console.error('[Zapli] Erro ao carregar dados:', err);
    } finally {
      setDataLoading(false);
    }
  }

  // ── AUTH ────────────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return false;
    return true;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setAuthUser(null);
  }, []);

  const register = useCallback(async (
    name: string, email: string, password: string, company: string, planId: string
  ): Promise<boolean> => {
    // 1. Criar conta no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError || !authData.user) return false;

    const userId = authData.user.id;

    // 2. Criar tenant
    const slug = company.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now().toString(36);
    const { data: tenant, error: tenantErr } = await db
      .from('tenants')
      .insert({ name: company, slug, plan: planId, plan_status: 'trial' })
      .select()
      .single();

    if (tenantErr || !tenant) return false;

    // 3. Criar perfil do usuário
    await db.from('users').insert({
      id: userId,
      tenant_id: (tenant as Record<string, unknown>).id as string,
      name,
      email,
      tenant_role: 'gestor',
      system_role: 'user',
    });

    // 4. Criar agent_connection vazio
    await db.from('agent_connections').insert({
      tenant_id: (tenant as Record<string, unknown>).id as string,
      status: 'offline',
    });

    return true;
  }, []);

  // ── CONTACTS ────────────────────────────────────────────────────────────────
  const addContact = useCallback(async (
    data: Omit<Contact, 'id' | 'userId' | 'createdAt' | 'messages' | 'followUpCount' | 'status' | 'lastContactAt' | 'nextFollowUpAt' | 'maxFollowUps'>
  ) => {
    if (!authUser?.tenantId) return;

    const { data: row, error } = await db.from('contacts').insert({
      tenant_id: authUser.tenantId,
      name: data.name,
      phone: data.phone,
      company: data.company ?? '',
      email: data.email ?? '',
      status: 'novo',
      stage: 'prospecting',
      notes: data.notes ?? '',
    }).select().single();

    if (error || !row) { console.error(error); return; }

    const plan = PLANS[authUser.planId ?? 'starter'];
    const newContact: Contact = {
      ...data,
      id: (row as Record<string, unknown>).id as string,
      userId: authUser.tenantId,
      status: 'aguardando',
      createdAt: new Date(),
      lastContactAt: null,
      nextFollowUpAt: null,
      followUpCount: 0,
      maxFollowUps: plan.maxFollowUps,
      messages: [],
      isPositiveResponse: false,
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
    // Persist message
    if (authUser?.tenantId) {
      db.from('messages').insert({
        tenant_id: authUser.tenantId,
        contact_id: id,
        content,
        direction: 'sent',
        source: 'bot',
        status: 'sent',
      }).then(() => {
        db.from('contacts').update({ status: 'em_contato', last_message_at: new Date().toISOString() })
          .eq('id', id);
      });
    }
    return { contact, message: content };
  }, [contacts, templates, authUser]);

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
    if (authUser?.tenantId) {
      db.from('messages').insert({
        tenant_id: authUser.tenantId,
        contact_id: id,
        content,
        direction: 'sent',
        source: 'bot',
        status: 'sent',
      });
    }
    return { contact, message: content };
  }, [contacts, templates, authUser]);

  const markPositiveResponse = useCallback((id: string) => {
    const contact = contacts.find(c => c.id === id);
    if (!contact) return;
    setContacts(prev => prev.map(c => c.id !== id ? c : { ...c, status: 'respondido', isPositiveResponse: true, nextFollowUpAt: null }));
    const notif: Notification = {
      id: `n_${Date.now()}`, contactId: id, contactName: contact.name,
      contactCompany: contact.company, contactPhone: contact.phone,
      type: 'positive_response',
      message: `${contact.name} (${contact.company}) retornou positivamente!`,
      createdAt: new Date(), isRead: false,
    };
    setNotifications(prev => [notif, ...prev]);
    if (authUser?.tenantId) {
      db.from('contacts').update({ status: 'positivo' }).eq('id', id);
      db.from('notifications').insert({
        tenant_id: authUser.tenantId,
        contact_id: id,
        contact_name: contact.name,
        type: 'positive_response',
        message: notif.message,
      });
    }
  }, [contacts, authUser]);

  const markConverted = useCallback((id: string) => {
    const contact = contacts.find(c => c.id === id);
    if (!contact) return;
    setContacts(prev => prev.map(c => c.id !== id ? c : { ...c, status: 'convertido' }));
    const notif: Notification = {
      id: `n_${Date.now()}`, contactId: id, contactName: contact.name,
      contactCompany: contact.company, contactPhone: contact.phone,
      type: 'converted',
      message: `${contact.name} (${contact.company}) foi convertido! 🎉`,
      createdAt: new Date(), isRead: false,
    };
    setNotifications(prev => [notif, ...prev]);
    const newDeal: Deal = {
      id: `d_${Date.now()}`, userId: authUser?.id ?? '',
      contactId: id, name: contact.name, company: contact.company,
      phone: contact.phone, email: contact.email,
      stage: 'contato', createdAt: new Date(), updatedAt: new Date(),
      fromProspecting: true, notes: contact.notes,
    };
    setDeals(prev => [newDeal, ...prev]);
    const clientId = `cl_${Date.now()}`;
    const newClient: Client = {
      id: clientId, userId: authUser?.id ?? '',
      contactId: id, companyName: contact.company, segment: '',
      contacts: [{ id: `cc_${Date.now()}`, name: contact.name, role: 'Contato principal', phone: contact.phone, email: contact.email, isPrimary: true, whatsapp: contact.phone }],
      status: 'ativo', healthScore: 70, ltv: 0,
      acquisitionDate: new Date(), fromProspecting: true,
      products: [], proposals: [], interactions: [], tags: ['novo-cliente'],
      notes: contact.notes, createdAt: new Date(), updatedAt: new Date(),
    };
    setClients(prev => [newClient, ...prev]);
    if (authUser?.tenantId) {
      db.from('contacts').update({ status: 'convertido' }).eq('id', id);
      db.from('deals').insert({
        tenant_id: authUser.tenantId, contact_id: id,
        title: contact.name, stage: 'lead', value: 0,
      });
      db.from('clients').insert({
        tenant_id: authUser.tenantId, name: contact.name,
        company: contact.company, phone: contact.phone, email: contact.email,
        status: 'ativo',
      });
    }
  }, [contacts, authUser]);

  const updateStatus = useCallback((id: string, status: ContactStatus) => {
    setContacts(prev => prev.map(c => c.id !== id ? c : { ...c, status }));
    const statusMap: Record<string, string> = {
      aguardando: 'novo', followup: 'em_contato', respondido: 'positivo',
      convertido: 'convertido', arquivado: 'nao_interessado',
    };
    if (authUser?.tenantId) {
      db.from('contacts').update({ status: statusMap[status] ?? status }).eq('id', id);
    }
  }, [authUser]);

  const addMessage = useCallback((contactId: string, content: string, type: 'sent' | 'received', source: 'bot' | 'human' = 'bot') => {
    const msgSource = type === 'received' ? 'human' : source;
    const msg = {
      id: `msg_${Date.now()}`, type, content, timestamp: new Date(),
      status: (type === 'sent' ? 'sent' : 'read') as 'sent' | 'read',
      source: msgSource,
      ...(msgSource === 'human' && type === 'sent' && authUser ? {
        sentById: authUser.id, sentByName: authUser.name, sentByRole: authUser.tenantRole,
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
    if (authUser?.tenantId) {
      db.from('messages').insert({
        tenant_id: authUser.tenantId,
        contact_id: contactId,
        content,
        direction: type === 'sent' ? 'sent' : 'received',
        source: msgSource,
        status: type === 'sent' ? 'sent' : 'read',
        sent_by: msgSource === 'human' && authUser ? authUser.id : undefined,
        sent_by_name: msgSource === 'human' && authUser ? authUser.name : undefined,
      });
    }
  }, [contacts, authUser]);

  const addGestorNotification = useCallback((title: string, message: string, type: 'system_info' | 'system_success' | 'system_warning' = 'system_info') => {
    const n: Notification = {
      id: `gn_${Date.now()}`, title, message, type, isRead: false, createdAt: new Date(),
    };
    setNotifications(prev => [n, ...prev]);
    if (authUser?.tenantId) {
      db.from('notifications').insert({ tenant_id: authUser.tenantId, title, message, type });
    }
  }, [authUser]);

  const deleteContact = useCallback((id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
    if (authUser?.tenantId) {
      db.from('contacts').delete().eq('id', id);
    }
  }, [authUser]);

  const updateTemplate = useCallback((id: string, content: string, name: string) => {
    setTemplates(prev => prev.map(t => t.id !== id ? t : { ...t, content, name }));
  }, []);

  const markNotifRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id !== id ? n : { ...n, isRead: true }));
    db.from('notifications').update({ read: true }).eq('id', id);
  }, []);

  const markAllNotifsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    if (authUser?.tenantId) {
      db.from('notifications').update({ read: true }).eq('tenant_id', authUser.tenantId);
    }
  }, [authUser]);

  // ── CRM / DEALS ─────────────────────────────────────────────────────────────
  const addDeal = useCallback((data: Omit<Deal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const newDeal: Deal = { ...data, id: `d_${Date.now()}`, userId: authUser?.id ?? '', createdAt: new Date(), updatedAt: new Date() };
    setDeals(prev => [newDeal, ...prev]);
    if (authUser?.tenantId) {
      db.from('deals').insert({
        tenant_id: authUser.tenantId,
        contact_id: data.contactId,
        title: data.name,
        value: data.value ?? 0,
        stage: 'lead',
        notes: data.notes ?? '',
      });
    }
  }, [authUser]);

  const moveDeal = useCallback((id: string, stage: DealStage) => {
    setDeals(prev => prev.map(d => d.id !== id ? d : { ...d, stage, updatedAt: new Date() }));
    if (authUser?.tenantId) {
      db.from('deals').update({ stage }).eq('id', id);
    }
  }, [authUser]);

  const updateDeal = useCallback((id: string, patch: Partial<Deal>) => {
    setDeals(prev => prev.map(d => d.id !== id ? d : { ...d, ...patch, updatedAt: new Date() }));
    if (authUser?.tenantId && patch.notes !== undefined) {
      db.from('deals').update({ notes: patch.notes }).eq('id', id);
    }
  }, [authUser]);

  const deleteDeal = useCallback((id: string) => {
    setDeals(prev => prev.filter(d => d.id !== id));
    if (authUser?.tenantId) {
      db.from('deals').delete().eq('id', id);
    }
  }, [authUser]);

  // ── CLIENTS ─────────────────────────────────────────────────────────────────
  const addClient = useCallback((data: Omit<Client, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): string => {
    const id = `cl_${Date.now()}`;
    setClients(prev => [{ ...data, id, userId: authUser?.id ?? '', createdAt: new Date(), updatedAt: new Date() }, ...prev]);
    if (authUser?.tenantId) {
      db.from('clients').insert({
        tenant_id: authUser.tenantId,
        name: data.contacts?.[0]?.name ?? data.companyName,
        company: data.companyName,
        phone: data.contacts?.[0]?.phone ?? '',
        email: data.contacts?.[0]?.email ?? '',
        status: data.status,
      });
    }
    return id;
  }, [authUser]);

  const updateClient = useCallback((id: string, patch: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id !== id ? c : { ...c, ...patch, updatedAt: new Date() }));
  }, []);

  const deleteClient = useCallback((id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    if (authUser?.tenantId) {
      db.from('clients').delete().eq('id', id);
    }
  }, [authUser]);

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
      ...c, products: [...c.products, product], ltv: c.ltv + product.totalValue, updatedAt: new Date(),
    }));
  }, []);

  const updateClientProduct = useCallback((clientId: string, idx: number, patch: Partial<ClientProduct>) => {
    setClients(prev => prev.map(c => {
      if (c.id !== clientId) return c;
      const prods = c.products.map((p, i) => i !== idx ? p : { ...p, ...patch });
      return { ...c, products: prods, ltv: prods.filter(p => p.status !== 'cancelado').reduce((s, p) => s + p.totalValue, 0), updatedAt: new Date() };
    }));
  }, []);

  // ── TEAM ────────────────────────────────────────────────────────────────────
  const addTeamMember = useCallback((data: Omit<TeamMember, 'id' | 'createdAt'>) => {
    const id = `m_${Date.now()}`;
    setTeamMembers(prev => [...prev, { ...data, id, createdAt: new Date() }]);
  }, []);

  const updateTeamMember = useCallback((id: string, patch: Partial<TeamMember>) => {
    setTeamMembers(prev => prev.map(m => m.id !== id ? m : { ...m, ...patch }));
  }, []);

  const removeTeamMember = useCallback((id: string) => {
    setTeamMembers(prev => prev.map(m => m.id !== id ? m : { ...m, isActive: false }));
    db.from('users').update({ active: false }).eq('id', id);
  }, []);

  const assignContact = useCallback((contactId: string, memberId: string, memberName: string, memberColor: string) => {
    setContacts(prev => prev.map(c => c.id !== contactId ? c : { ...c, assignedTo: memberId, assignedToName: memberName, assignedToColor: memberColor }));
    db.from('contacts').update({ assigned_to: memberId }).eq('id', contactId);
  }, []);

  const assignDeal = useCallback((dealId: string, memberId: string, memberName: string, memberColor: string) => {
    setDeals(prev => prev.map(d => d.id !== dealId ? d : { ...d, assignedTo: memberId, assignedToName: memberName, assignedToColor: memberColor, updatedAt: new Date() }));
    db.from('deals').update({ assigned_to: memberId }).eq('id', dealId);
  }, []);

  const addDealTimelineEvent = useCallback((dealId: string, event: Omit<DealTimelineEvent, 'id'>) => {
    const ev: DealTimelineEvent = { ...event, id: `tlev_${Date.now()}` };
    setDeals(prev => prev.map(d => d.id !== dealId ? d : { ...d, timeline: [...(d.timeline ?? []), ev], updatedAt: new Date() }));
  }, []);

  const logActivity = useCallback((entry: Omit<ActivityLog, 'id'>) => {
    setActivityLog(prev => [{ ...entry, id: `al_${Date.now()}` }, ...prev]);
  }, []);

  // ── STATS ───────────────────────────────────────────────────────────────────
  const responded = contacts.filter(c => ['respondido', 'convertido'].includes(c.status)).length;
  const contacted = contacts.filter(c => c.messages.length > 0).length;
  const stats = {
    total: contacts.length,
    aguardando: contacts.filter(c => c.status === 'aguardando').length,
    followup: contacts.filter(c => c.status === 'followup').length,
    respondido: contacts.filter(c => c.status === 'respondido').length,
    convertido: contacts.filter(c => c.status === 'convertido').length,
    arquivado: contacts.filter(c => c.status === 'arquivado').length,
    responseRate: contacted > 0 ? Math.round((responded / contacted) * 100) : 0,
    conversionRate: contacts.length > 0 ? Math.round((contacts.filter(c => c.status === 'convertido').length / contacts.length) * 100) : 0,
    positiveCount: contacts.filter(c => c.isPositiveResponse).length,
  };

  return (
    <AuthContext.Provider value={{ user: authUser, loading: authLoading, login, logout, register }}>
      <ProspectContext.Provider value={{
        contacts, notifications, templates, deals, clients,
        teamMembers, activityLog, dataLoading,
        addContact, sendInitialMessage, sendFollowUp, markPositiveResponse,
        markConverted, updateStatus, addMessage, deleteContact, updateTemplate,
        markNotifRead, markAllNotifsRead,
        unreadCount: notifications.filter(n => !n.isRead).length,
        addDeal, moveDeal, updateDeal, deleteDeal,
        addClient, updateClient, deleteClient,
        addClientContact, removeClientContact,
        addProposal, updateProposal, addInteraction,
        addClientProduct, updateClientProduct,
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
