import {
  createContext, useContext, useState, useCallback, useEffect, useMemo,
  type ReactNode,
} from 'react';
import { supabase, db } from '@/lib/supabase';
import type {
  AuthUser, Contact, ContactStatus, Notification, MessageTemplate,
  Deal, DealStage, Client, ClientContact, ClientProduct, Proposal,
  ClientInteraction, TeamMember, ActivityLog, DealTimelineEvent,
} from '@/lib/index';
import { addDays, buildMessage, PLANS } from '@/lib/index';

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

function rowToContact(row: any): Contact {
  return {
    id: row.id,
    userId: row.tenant_id || '',
    name: row.name,
    phone: row.phone,
    company: row.company || '',
    email: row.email || '',
    status: (row.status || 'aguardando') as ContactStatus,
    createdAt: new Date(row.created_at),
    lastContactAt: row.last_message_at ? new Date(row.last_message_at) : null,
    nextFollowUpAt: null,
    followUpCount: 0,
    maxFollowUps: 3,
    messages: [],
    isPositiveResponse: row.status === 'respondido',
    notes: row.notes || '',
    segment: '',
    city: '',
    state: '',
    assignedTo: row.assigned_to || undefined,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);

  useEffect(() => {
    // Controle para evitar race condition entre getSession e onAuthStateChange
    let initialized = false;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) await loadUserProfile(session.user.id);
      initialized = true;
      setAuthLoading(false);
    }).catch(() => {
      initialized = true;
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // Evita processamento duplicado na inicialização (getSession já cuidou disso)
      if (!initialized && _event === 'INITIAL_SESSION') return;

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

  async function loadUserProfile(userId: string) {
    setAuthLoading(true);
    try {
      // Timeout de 10s para carregar o perfil
      const profilePromise = db.from('users').select('*, tenants(*)').eq('id', userId).single();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout loading profile')), 10000)
      );

      const { data: profile, error } = await Promise.race([profilePromise, timeoutPromise]) as any;
      
      // Se não encontrou o perfil na tabela users, loga o erro mas não trava
      if (!profile) {
        console.error('[Zapli] Perfil de usuário não encontrado na tabela users:', error?.message || 'sem dados');
        // Cria um perfil mínimo para evitar loop — usuário autenticado mas sem tenant
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          setAuthUser({
            id: authUser.id,
            name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Usuário',
            email: authUser.email || '',
            role: 'user',
            tenantRole: 'gestor',
            tenantId: undefined,
            companyName: '',
            planId: 'starter',
            subscriptionStatus: 'trial',
            contactsUsed: 0,
            avatarColor: '#6366f1',
          });
        }
        setAuthLoading(false);
        return;
      }

    const tenant = profile.tenants;
    const user: AuthUser = {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: (profile.system_role as 'admin' | 'user') ?? 'user',
      tenantRole: (profile.tenant_role as 'gestor' | 'vendedor' | 'sdr') ?? 'vendedor',
      tenantId: profile.tenant_id ?? undefined,
      companyName: tenant?.name || '',
      planId: (tenant?.plan || 'starter') as AuthUser['planId'],
      subscriptionStatus: (tenant?.plan_status === 'active' ? 'active' : 'trial') as AuthUser['subscriptionStatus'],
      contactsUsed: 0,
      avatarColor: '#6366f1',
    };

    setAuthUser(user);
    if (profile.tenant_id) {
      try {
        await loadTenantData(profile.tenant_id);
      } catch (err) {
        console.error('[Zapli] Erro ao carregar dados do tenant:', err);
      }
    }
    } catch (err) {
      console.error('[Zapli] Erro crítico ao carregar perfil:', err);
    } finally {
      setAuthLoading(false);
    }
  }

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

      if (contactRows) setContacts(contactRows.map(rowToContact));
      if (dealRows) setDeals(dealRows.map(row => ({
        id: row.id, userId: row.tenant_id || '', contactId: row.contact_id || undefined,
        name: row.title || '', company: '', phone: '', stage: (row.stage as DealStage) || 'contato',
        value: Number(row.value) || 0, notes: row.notes || '', createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at), fromProspecting: false, assignedTo: row.assigned_to || undefined,
        timeline: [],
      })));
      if (clientRows) setClients(clientRows.map(row => ({
        id: row.id, userId: row.tenant_id || '', companyName: row.company || row.name || '',
        segment: '', contacts: [{ id: `cc_${row.id}`, name: row.name || '', role: 'Principal', phone: row.phone || '', email: row.email || '', isPrimary: true, whatsapp: row.phone || '' }],
        status: (row.status || 'ativo') as Client['status'], healthScore: 70, ltv: (Number(row.mrr) || 0) * 12,
        acquisitionDate: new Date(row.created_at), fromProspecting: false, products: [], proposals: [], interactions: [], tags: [], notes: row.notes || '', createdAt: new Date(row.created_at),
      })));
      if (notifRows) setNotifications(notifRows.map(row => ({
        id: row.id, contactId: row.contact_id, contactName: '', contactCompany: '', contactPhone: '',
        type: (row.type as any) || 'system_info', title: row.title, message: row.message, createdAt: new Date(row.created_at), isRead: row.read,
      })));
      if (memberRows) setTeamMembers(memberRows.map(row => ({
        id: row.id, name: row.name, email: row.email, role: (row.tenant_role as any) || 'vendedor',
        status: row.active ? 'online' : 'offline', isActive: row.active, createdAt: new Date(row.created_at),
        stats: { leads: 0, responses: 0, conversions: 0 }, color: '#6366f1',
      })));
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setDataLoading(false);
    }
  }

  const login = async (email: string, password: string) => {
    try {
      // Timeout de 15s para não deixar a tela travada indefinidamente
      const loginPromise = supabase.auth.signInWithPassword({ email, password });
      const timeoutPromise = new Promise<{ data: null; error: Error }>(resolve =>
        setTimeout(() => resolve({ data: null, error: new Error('Tempo limite excedido. Verifique sua conexão.') }), 15000)
      );

      const result = await Promise.race([loginPromise, timeoutPromise]);
      const { data, error } = result as Awaited<typeof loginPromise>;

      if (error || !data?.user) return false;
      await loadUserProfile(data.user.id);
      return true;
    } catch (err) {
      console.error('[Zapli] Erro inesperado no login:', err);
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setAuthUser(null);
  };

  const register = async (name: string, email: string, password: string, company: string, planId: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
    if (error || !data.user) return false;
    
    const { data: tenant } = await db.from('tenants').insert({ name: company, plan: planId, plan_status: 'trial' }).select().single();
    if (tenant) {
      await db.from('users').insert({ id: data.user.id, name, email, tenant_id: tenant.id, tenant_role: 'gestor', system_role: 'user' });
      await loadUserProfile(data.user.id);
      return true;
    }
    return false;
  };

  const addContact = useCallback(async (data: any) => {
    if (!authUser?.tenantId) {
      console.error('[Zapli] Erro: tenantId nao encontrado. Usuario nao autenticado.');
      return;
    }
    try {
      const { data: newContact, error } = await db.from('contacts').insert({
        tenant_id: authUser.tenantId,
        name: data.name,
        phone: data.phone,
        company: data.company,
        email: data.email,
        status: 'aguardando',
        notes: data.notes,
      }).select().single();
      
      if (error) {
        console.error('[Zapli] Erro ao inserir contato:', error);
        return;
      }
      
      if (newContact) {
        console.log('[Zapli] Contato inserido com sucesso:', newContact);
        setContacts(prev => [rowToContact(newContact), ...prev]);
      }
    } catch (err) {
      console.error('[Zapli] Erro ao adicionar contato:', err);
    }
  }, [authUser]);

  const sendInitialMessage = useCallback((id: string, companyName: string) => {
    const contact = contacts.find(c => c.id === id);
    if (!contact) return null;
    const message = buildMessage('initial', contact.name, companyName);
    updateStatus(id, 'aguardando');
    return { contact, message };
  }, [contacts]);

  const sendFollowUp = useCallback((id: string, companyName: string) => {
    const contact = contacts.find(c => c.id === id);
    if (!contact) return null;
    const message = buildMessage('followup', contact.name, companyName);
    updateStatus(id, 'followup');
    return { contact, message };
  }, [contacts]);

  const updateStatus = useCallback(async (id: string, status: ContactStatus) => {
    try {
      const { error } = await db.from('contacts').update({ status }).eq('id', id);
      if (error) {
        console.error('[Zapli] Erro ao atualizar status:', error);
        return;
      }
      setContacts(prev => prev.map(c => c.id === id ? { ...c, status } : c));
      console.log('[Zapli] Status atualizado com sucesso para:', status);
    } catch (err) {
      console.error('[Zapli] Erro ao atualizar status:', err);
    }
  }, []);

  const markPositiveResponse = useCallback((id: string) => updateStatus(id, 'respondido'), [updateStatus]);
  const markConverted = useCallback((id: string) => updateStatus(id, 'convertido'), [updateStatus]);

  const addMessage = useCallback(async (contactId: string, content: string, type: 'sent' | 'received', source?: 'bot' | 'human') => {
    // Implementação real de mensagens se houver tabela
  }, []);

  const deleteContact = useCallback(async (id: string) => {
    try {
      const { error } = await db.from('contacts').delete().eq('id', id);
      if (error) {
        console.error('[Zapli] Erro ao deletar contato:', error);
        return;
      }
      setContacts(prev => prev.filter(c => c.id !== id));
      console.log('[Zapli] Contato deletado com sucesso');
    } catch (err) {
      console.error('[Zapli] Erro ao deletar contato:', err);
    }
  }, []);

  const updateTemplate = useCallback((id: string, content: string, name: string) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, content, name } : t));
  }, []);

  const markNotifRead = useCallback(async (id: string) => {
    try {
      const { error } = await db.from('notifications').update({ read: true }).eq('id', id);
      if (error) {
        console.error('[Zapli] Erro ao marcar notificacao como lida:', error);
        return;
      }
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('[Zapli] Erro ao marcar notificacao como lida:', err);
    }
  }, []);

  const markAllNotifsRead = useCallback(async () => {
    if (!authUser?.tenantId) return;
    try {
      const { error } = await db.from('notifications').update({ read: true }).eq('tenant_id', authUser.tenantId);
      if (error) {
        console.error('[Zapli] Erro ao marcar todas as notificacoes como lidas:', error);
        return;
      }
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('[Zapli] Erro ao marcar todas as notificacoes como lidas:', err);
    }
  }, [authUser]);

  const addDeal = useCallback(async (data: any) => {
    if (!authUser?.tenantId) return;
    try {
      const { data: newDeal, error } = await db.from('deals').insert({
        tenant_id: authUser.tenantId,
        title: data.name,
        value: data.value,
        stage: data.stage,
        notes: data.notes,
        contact_id: data.contactId,
      }).select().single();
      if (error) {
        console.error('[Zapli] Erro ao inserir deal:', error);
        return;
      }
      if (newDeal) {
        console.log('[Zapli] Deal inserido com sucesso:', newDeal);
        setDeals(prev => [{
          id: newDeal.id, userId: newDeal.tenant_id, title: newDeal.title, value: Number(newDeal.value),
          stage: newDeal.stage as DealStage, notes: newDeal.notes, createdAt: new Date(newDeal.created_at),
          updatedAt: new Date(newDeal.updated_at), fromProspecting: !!newDeal.contact_id,
          timeline: [], name: newDeal.title, company: '', phone: ''
        } as any, ...prev]);
      }
    } catch (err) {
      console.error('[Zapli] Erro ao adicionar deal:', err);
    }
  }, [authUser]);

  const moveDeal = useCallback(async (id: string, stage: DealStage) => {
    try {
      const { error } = await db.from('deals').update({ stage, updated_at: new Date() }).eq('id', id);
      if (error) {
        console.error('[Zapli] Erro ao mover deal:', error);
        return;
      }
      setDeals(prev => prev.map(d => d.id === id ? { ...d, stage, updatedAt: new Date() } : d));
    } catch (err) {
      console.error('[Zapli] Erro ao mover deal:', err);
    }
  }, []);

  const updateDeal = useCallback(async (id: string, patch: any) => {
    try {
      const { error } = await db.from('deals').update({ ...patch, updated_at: new Date() }).eq('id', id);
      if (error) {
        console.error('[Zapli] Erro ao atualizar deal:', error);
        return;
      }
      setDeals(prev => prev.map(d => d.id === id ? { ...d, ...patch, updatedAt: new Date() } : d));
    } catch (err) {
      console.error('[Zapli] Erro ao atualizar deal:', err);
    }
  }, []);

  const deleteDeal = useCallback(async (id: string) => {
    try {
      const { error } = await db.from('deals').delete().eq('id', id);
      if (error) {
        console.error('[Zapli] Erro ao deletar deal:', error);
        return;
      }
      setDeals(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error('[Zapli] Erro ao deletar deal:', err);
    }
  }, []);

  const addClient = useCallback((data: any) => {
    const id = Math.random().toString(36).substr(2, 9);
    setClients(prev => [{ ...data, id, createdAt: new Date(), updatedAt: new Date() } as any, ...prev]);
    return id;
  }, []);

  const updateClient = useCallback((id: string, patch: any) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...patch, updatedAt: new Date() } : c));
  }, []);

  const deleteClient = useCallback((id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
  }, []);

  const addTeamMember = useCallback((data: any) => {
    setTeamMembers(prev => [{ ...data, id: Math.random().toString(36).substr(2, 9), createdAt: new Date() } as any, ...prev]);
  }, []);

  const updateTeamMember = useCallback((id: string, patch: any) => {
    setTeamMembers(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m));
  }, []);

  const removeTeamMember = useCallback((id: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id));
  }, []);

  const logActivity = useCallback((entry: any) => {
    setActivityLog(prev => [{ ...entry, id: Math.random().toString(36).substr(2, 9) } as any, ...prev]);
  }, []);

  const addGestorNotification = useCallback((title: string, message: string, type: any = 'system_info') => {
    setNotifications(prev => [{
      id: Math.random().toString(36).substr(2, 9),
      type, title, message, createdAt: new Date(), isRead: false,
      contactId: '', contactName: '', contactCompany: '', contactPhone: ''
    }, ...prev]);
  }, []);

  const stats = useMemo(() => {
    const total = contacts.length;
    const aguardando = contacts.filter(c => c.status === 'aguardando').length;
    const followup = contacts.filter(c => c.status === 'followup').length;
    const respondido = contacts.filter(c => c.status === 'respondido').length;
    const convertido = contacts.filter(c => c.status === 'convertido').length;
    const arquivado = contacts.filter(c => c.status === 'arquivado').length;
    const positiveCount = respondido + convertido;
    const responseRate = total > 0 ? (positiveCount / total) * 100 : 0;
    const conversionRate = total > 0 ? (convertido / total) * 100 : 0;

    return { total, aguardando, followup, respondido, convertido, arquivado, responseRate, conversionRate, positiveCount };
  }, [contacts]);

  return (
    <AuthContext.Provider value={{ user: authUser, loading: authLoading, login, logout, register }}>
      <ProspectContext.Provider value={{
        contacts, notifications, templates, deals, clients, teamMembers, activityLog, dataLoading,
        addContact, sendInitialMessage, sendFollowUp, markPositiveResponse, markConverted, updateStatus,
        addMessage, deleteContact, updateTemplate, markNotifRead, markAllNotifsRead, unreadCount: notifications.filter(n => !n.isRead).length,
        addDeal, moveDeal, updateDeal, deleteDeal, addClient, updateClient, deleteClient,
        addClientContact: () => {}, removeClientContact: () => {}, addProposal: () => {}, updateProposal: () => {},
        addInteraction: () => {}, addClientProduct: () => {}, updateClientProduct: () => {},
        addTeamMember, updateTeamMember, removeTeamMember, assignContact: () => {}, assignDeal: () => {},
        addDealTimelineEvent: () => {}, logActivity, addGestorNotification, stats
      }}>
        {children}
      </ProspectContext.Provider>
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AppProvider');
  return context;
};

export const useProspect = () => {
  const context = useContext(ProspectContext);
  if (!context) throw new Error('useProspect must be used within an AppProvider');
  return context;
};
