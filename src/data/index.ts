import type { MessageTemplate } from '@/lib/index';

// ============== ESTRUTURAS VAZIAS (PRODUÇÃO) ==============
export const mockUsers = [];
export const mockContacts = [];
export const mockNotifications = [];

// ============== TEMPLATES PADRÃO (Para novos usuários) ==============
export const defaultTemplates: Omit<MessageTemplate, 'userId' | 'createdAt'>[] = [
  {
    id: 'tpl_initial', name: 'Apresentação Inicial', type: 'initial',
    content: 'Olá [Nome]! 👋\n\nSou da [Empresa] e gostaria de apresentar nossas soluções para a [EmpresaContato].\n\nAcreditamos que podemos colaborar de forma estratégica. Tem um momento para uma conversa rápida?',
  },
  {
    id: 'tpl_fu1', name: 'Follow-up 1', type: 'followup_1',
    content: 'Olá [Nome]! 😊\n\nPassando para retomar o contato. Enviamos uma mensagem há alguns dias sobre uma possível parceria com a [EmpresaContato].\n\nA agenda é corrida, entendemos! Que tal uma conversa de 15 minutos? Podemos nos adaptar ao seu horário. 📅',
  },
  {
    id: 'tpl_fu2', name: 'Follow-up 2', type: 'followup_2',
    content: 'Oi [Nome]! 🚀\n\nSó mais uma mensagem da [Empresa]. Nossos clientes parceiros têm acesso a:\n\n✅ Atendimento dedicado\n✅ Condições comerciais exclusivas\n✅ Suporte técnico especializado\n\nSe tiver interesse, é só responder aqui!',
  },
  {
    id: 'tpl_fu3', name: 'Follow-up 3', type: 'followup_3',
    content: 'Olá [Nome]! Esta é nossa última mensagem. 🙂\n\nCaso queira saber mais sobre a [Empresa] no futuro, estaremos aqui.\n\nTenha uma ótima semana! 🤝',
  },
];

// ============== ADMIN STATS (Inicializado em zero) ==============
export const adminStats = {
  mrr: 0,
  mrrGrowth: 0,
  totalUsers: 0,
  activeUsers: 0,
  churnRate: 0,
  trialUsers: 0,
  planDistribution: {
    starter: 0,
    pro: 0,
    business: 0,
  },
  revenueByMonth: [],
  newUsersByMonth: [],
};
