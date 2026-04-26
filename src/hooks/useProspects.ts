import { useState, useCallback, useEffect } from 'react';
import type { Prospect, Notification, ProspectStatus } from '@/lib/index';
import { addDays, buildMessage } from '@/lib/index';
import { initialProspects, initialNotifications, messageTemplates, companySettings } from '@/data/index';

// ========== PROSPECT STORE ==========
export function useProspects() {
  const [prospects, setProspects] = useState<Prospect[]>(initialProspects);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const addProspect = useCallback((data: Omit<Prospect, 'id' | 'createdAt' | 'messages' | 'followUpCount' | 'status' | 'lastContactAt' | 'nextFollowUpAt' | 'maxFollowUps'>) => {
    const newProspect: Prospect = {
      ...data,
      id: `p_${Date.now()}`,
      status: 'aguardando',
      createdAt: new Date(),
      lastContactAt: null,
      nextFollowUpAt: null,
      followUpCount: 0,
      maxFollowUps: companySettings.maxFollowUps,
      messages: [],
      isPositiveResponse: false,
    };
    setProspects(prev => [newProspect, ...prev]);
    return newProspect;
  }, []);

  const updateStatus = useCallback((id: string, status: ProspectStatus) => {
    setProspects(prev => prev.map(p => p.id === id ? { ...p, status } : p));
  }, []);

  const updateProspect = useCallback((id: string, updates: Partial<Prospect>) => {
    setProspects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const sendInitialMessage = useCallback((id: string) => {
    const prospect = prospects.find(p => p.id === id);
    if (!prospect) return null;

    const tpl = messageTemplates.find(t => t.type === 'initial');
    if (!tpl) return null;

    const content = buildMessage(tpl.content, {
      Nome: prospect.name.split(' ')[0],
      Construtora: companySettings.name,
      Escritório: prospect.office,
    });

    const newMsg = {
      id: `msg_${Date.now()}`,
      type: 'sent' as const,
      content,
      timestamp: new Date(),
      status: 'sent' as const,
    };

    setProspects(prev => prev.map(p => {
      if (p.id !== id) return p;
      return {
        ...p,
        status: 'aguardando',
        lastContactAt: new Date(),
        nextFollowUpAt: addDays(new Date(), companySettings.followUpDays),
        messages: [...p.messages, newMsg],
      };
    }));

    return { prospect, message: content };
  }, [prospects]);

  const sendFollowUp = useCallback((id: string) => {
    const prospect = prospects.find(p => p.id === id);
    if (!prospect) return null;
    if (prospect.followUpCount >= prospect.maxFollowUps) return null;

    const followUpNum = prospect.followUpCount + 1;
    const tplType = `followup_${followUpNum}` as 'followup_1' | 'followup_2' | 'followup_3';
    const tpl = messageTemplates.find(t => t.type === tplType) || messageTemplates.find(t => t.type === 'followup_1');
    if (!tpl) return null;

    const content = buildMessage(tpl.content, {
      Nome: prospect.name.split(' ')[0],
      Construtora: companySettings.name,
      Escritório: prospect.office,
    });

    const newMsg = {
      id: `msg_${Date.now()}`,
      type: 'sent' as const,
      content,
      timestamp: new Date(),
      status: 'sent' as const,
      isFollowUp: true,
      followUpNumber: followUpNum,
    };

    const newFollowUpCount = followUpNum;
    const newStatus: ProspectStatus = newFollowUpCount >= prospect.maxFollowUps ? 'arquivado' : 'followup';

    setProspects(prev => prev.map(p => {
      if (p.id !== id) return p;
      return {
        ...p,
        status: newStatus,
        lastContactAt: new Date(),
        followUpCount: newFollowUpCount,
        nextFollowUpAt: newStatus === 'arquivado' ? null : addDays(new Date(), companySettings.followUpDays),
        messages: [...p.messages, newMsg],
      };
    }));

    return { prospect, message: content };
  }, [prospects]);

  const markPositiveResponse = useCallback((id: string) => {
    const prospect = prospects.find(p => p.id === id);
    if (!prospect) return;

    setProspects(prev => prev.map(p => {
      if (p.id !== id) return p;
      return { ...p, status: 'respondido', isPositiveResponse: true, nextFollowUpAt: null };
    }));

    const newNotif: Notification = {
      id: `n_${Date.now()}`,
      prospectId: id,
      prospectName: prospect.name,
      prospectOffice: prospect.office,
      prospectPhone: prospect.phone,
      type: 'positive_response',
      message: `${prospect.name} (${prospect.office}) retornou positivamente. Encaminhar para equipe comercial!`,
      createdAt: new Date(),
      isRead: false,
    };

    setNotifications(prev => [newNotif, ...prev]);
  }, [prospects]);

  const markConverted = useCallback((id: string) => {
    const prospect = prospects.find(p => p.id === id);
    if (!prospect) return;

    setProspects(prev => prev.map(p => p.id === id ? { ...p, status: 'convertido' } : p));

    const newNotif: Notification = {
      id: `n_${Date.now()}`,
      prospectId: id,
      prospectName: prospect.name,
      prospectOffice: prospect.office,
      prospectPhone: prospect.phone,
      type: 'converted',
      message: `${prospect.name} (${prospect.office}) foi convertido! Parabéns à equipe comercial! 🎉`,
      createdAt: new Date(),
      isRead: false,
    };

    setNotifications(prev => [newNotif, ...prev]);
  }, [prospects]);

  const markNotifRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  }, []);

  const markAllNotifsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  const addMessage = useCallback((prospectId: string, content: string, type: 'sent' | 'received') => {
    const msg = {
      id: `msg_${Date.now()}`,
      type,
      content,
      timestamp: new Date(),
      status: type === 'sent' ? 'sent' as const : 'read' as const,
    };
    setProspects(prev => prev.map(p => {
      if (p.id !== prospectId) return p;
      return {
        ...p,
        messages: [...p.messages, msg],
        lastContactAt: new Date(),
        ...(type === 'received' && !p.isPositiveResponse ? { status: 'respondido' as ProspectStatus } : {}),
      };
    }));
  }, []);

  const deleteProspect = useCallback((id: string) => {
    setProspects(prev => prev.filter(p => p.id !== id));
  }, []);

  // Check for pending follow-ups
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setProspects(prev => prev.map(p => {
        if (
          p.status === 'aguardando' &&
          p.nextFollowUpAt &&
          p.nextFollowUpAt <= now &&
          p.followUpCount < p.maxFollowUps
        ) {
          return { ...p, status: 'followup' };
        }
        return p;
      }));
    }, 60000); // check every minute
    return () => clearInterval(interval);
  }, []);

  const stats = {
    totalProspects: prospects.length,
    aguardando: prospects.filter(p => p.status === 'aguardando').length,
    followup: prospects.filter(p => p.status === 'followup').length,
    respondido: prospects.filter(p => p.status === 'respondido').length,
    convertido: prospects.filter(p => p.status === 'convertido').length,
    arquivado: prospects.filter(p => p.status === 'arquivado').length,
    responseRate: prospects.length > 0
      ? Math.round(
          (prospects.filter(p => ['respondido', 'convertido'].includes(p.status)).length /
            Math.max(1, prospects.filter(p => p.status !== 'aguardando').length)) *
            100
        )
      : 0,
    conversionRate: prospects.length > 0
      ? Math.round(
          (prospects.filter(p => p.status === 'convertido').length / prospects.length) * 100
        )
      : 0,
    pendingFollowUps: prospects.filter(p => p.status === 'followup').length,
    positiveResponses: prospects.filter(p => p.isPositiveResponse).length,
    unreadNotifications: notifications.filter(n => !n.isRead).length,
  };

  return {
    prospects,
    notifications,
    stats,
    addProspect,
    updateStatus,
    updateProspect,
    sendInitialMessage,
    sendFollowUp,
    markPositiveResponse,
    markConverted,
    markNotifRead,
    markAllNotifsRead,
    addMessage,
    deleteProspect,
  };
}
