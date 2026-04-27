import type { User, Contact, MessageTemplate, Notification } from '@/lib/index';
import { addDays } from '@/lib/index';

const now = new Date();
const d = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86400000);

// ============== USERS ==============
export const mockUsers: User[] = [
  {
    id: 'u1',
    name: 'Ana Oliveira',
    email: 'ana@construtoraabc.com.br',
    role: 'user',
    companyName: 'Construtora ABC',
    planId: 'pro',
    subscriptionStatus: 'active',
    createdAt: d(45),
    lastLoginAt: d(0),
    contactsUsed: 87,
  },
  {
    id: 'u2',
    name: 'Carlos Souza',
    email: 'carlos@fornecedorxyz.com.br',
    role: 'user',
    companyName: 'Fornecedor XYZ',
    planId: 'starter',
    subscriptionStatus: 'active',
    createdAt: d(30),
    lastLoginAt: d(1),
    contactsUsed: 32,
  },
  {
    id: 'u3',
    name: 'Mariana Lima',
    email: 'mariana@agenciamrl.com.br',
    role: 'user',
    companyName: 'Agência MRL',
    planId: 'business',
    subscriptionStatus: 'active',
    createdAt: d(60),
    lastLoginAt: d(0),
    contactsUsed: 215,
  },
  {
    id: 'u4',
    name: 'Pedro Alves',
    email: 'pedro@consultoriapa.com.br',
    role: 'user',
    companyName: 'Consultoria PA',
    planId: 'starter',
    subscriptionStatus: 'trial',
    createdAt: d(7),
    lastLoginAt: d(2),
    contactsUsed: 8,
    trialEndsAt: addDays(now, 7),
  },
  {
    id: 'u5',
    name: 'Juliana Costa',
    email: 'juliana@techsolucoes.com.br',
    role: 'user',
    companyName: 'Tech Soluções',
    planId: 'pro',
    subscriptionStatus: 'past_due',
    createdAt: d(90),
    lastLoginAt: d(10),
    contactsUsed: 140,
  },
  {
    id: 'admin1',
    name: 'Admin Zapli',
    email: 'admin@zapli.io',
    role: 'admin',
    companyName: 'Zapli',
    planId: 'business',
    subscriptionStatus: 'active',
    createdAt: d(180),
    lastLoginAt: d(0),
    contactsUsed: 0,
  },
];

// ============== CONTACTS (for demo user "ana") ==============
export const mockContacts: Contact[] = [
  {
    id: 'c1', userId: 'u1', name: 'Roberto Fernandes', company: 'RF Engenharia',
    phone: '11987654321', city: 'São Paulo', state: 'SP', segment: 'Engenharia',
    email: 'roberto@rfeng.com.br', status: 'convertido', createdAt: d(20),
    lastContactAt: d(3), nextFollowUpAt: null, followUpCount: 1, maxFollowUps: 5,
    isPositiveResponse: true,
    notes: 'Interesse em fornecimento para 3 obras no Morumbi.',
    messages: [
      { id: 'm1', type: 'sent', content: 'Olá Roberto! 👋\n\nSomos a Construtora ABC e gostaríamos de apresentar nossas soluções. Posso marcar uma conversa rápida?', timestamp: d(20), status: 'read' },
      { id: 'm2', type: 'received', content: 'Oi! Sim, tenho interesse. Pode me chamar amanhã às 14h?', timestamp: d(18), status: 'read' },
      { id: 'm3', type: 'sent', content: 'Ótimo Roberto! Já pedi para nossa equipe entrar em contato. Obrigado!', timestamp: d(17), status: 'read' },
    ],
  },
  {
    id: 'c2', userId: 'u1', name: 'Fernanda Castro', company: 'Castro & Associados',
    phone: '21976543210', city: 'Rio de Janeiro', state: 'RJ', segment: 'Consultoria',
    status: 'respondido', createdAt: d(10), lastContactAt: d(2), nextFollowUpAt: null,
    followUpCount: 0, maxFollowUps: 5, isPositiveResponse: true,
    notes: 'Quer saber sobre parceria mensal.',
    messages: [
      { id: 'm4', type: 'sent', content: 'Olá Fernanda! Somos a Construtora ABC. Temos uma proposta de parceria que pode interessar. Podemos conversar?', timestamp: d(10), status: 'read' },
      { id: 'm5', type: 'received', content: 'Oi! Que tipo de parceria? Me conta mais.', timestamp: d(2), status: 'read' },
    ],
  },
  {
    id: 'c3', userId: 'u1', name: 'Bruno Teixeira', company: 'BT Soluções',
    phone: '31965432109', city: 'Belo Horizonte', state: 'MG', segment: 'Tecnologia',
    status: 'followup', createdAt: d(8), lastContactAt: d(8), nextFollowUpAt: addDays(now, 0),
    followUpCount: 1, maxFollowUps: 5, isPositiveResponse: false,
    messages: [
      { id: 'm6', type: 'sent', content: 'Olá Bruno! Somos a Construtora ABC. Gostaríamos de apresentar nossas soluções. Podemos conversar?', timestamp: d(8), status: 'delivered' },
      { id: 'm7', type: 'sent', content: 'Olá Bruno! Tentando contato novamente. Temos condições especiais para parceiros. Tem um momento?', timestamp: d(5), status: 'delivered', isFollowUp: true, followUpNumber: 1 },
    ],
  },
  {
    id: 'c4', userId: 'u1', name: 'Camila Neves', company: 'Neves Comércio',
    phone: '51954321098', city: 'Porto Alegre', state: 'RS', segment: 'Comércio',
    status: 'aguardando', createdAt: d(1), lastContactAt: d(1), nextFollowUpAt: addDays(now, 2),
    followUpCount: 0, maxFollowUps: 5, isPositiveResponse: false,
    messages: [
      { id: 'm8', type: 'sent', content: 'Olá Camila! Somos a Construtora ABC. Gostaríamos de apresentar nossas soluções. Podemos conversar?', timestamp: d(1), status: 'sent' },
    ],
  },
  {
    id: 'c5', userId: 'u1', name: 'Marcos Vieira', company: 'Vieira & Filhos',
    phone: '41943210987', city: 'Curitiba', state: 'PR', segment: 'Indústria',
    status: 'aguardando', createdAt: now, lastContactAt: now, nextFollowUpAt: addDays(now, 3),
    followUpCount: 0, maxFollowUps: 5, isPositiveResponse: false,
    messages: [
      { id: 'm9', type: 'sent', content: 'Olá Marcos! Somos a Construtora ABC. Gostaríamos de apresentar nossas soluções. Podemos conversar?', timestamp: now, status: 'sent' },
    ],
  },
  {
    id: 'c6', userId: 'u1', name: 'Larissa Pinto', company: 'LP Serviços',
    phone: '47932109876', city: 'Florianópolis', state: 'SC', segment: 'Serviços',
    status: 'arquivado', createdAt: d(30), lastContactAt: d(9), nextFollowUpAt: null,
    followUpCount: 3, maxFollowUps: 5, isPositiveResponse: false,
    notes: 'Sem resposta após 3 tentativas.',
    messages: [
      { id: 'm10', type: 'sent', content: 'Olá Larissa!...', timestamp: d(30), status: 'delivered' },
      { id: 'm11', type: 'sent', content: 'Follow-up 1...', timestamp: d(27), status: 'delivered', isFollowUp: true, followUpNumber: 1 },
      { id: 'm12', type: 'sent', content: 'Follow-up 2...', timestamp: d(24), status: 'delivered', isFollowUp: true, followUpNumber: 2 },
      { id: 'm13', type: 'sent', content: 'Follow-up 3...', timestamp: d(21), status: 'delivered', isFollowUp: true, followUpNumber: 3 },
    ],
  },
];

// ============== NOTIFICATIONS ==============
export const mockNotifications: Notification[] = [
  {
    id: 'n1', contactId: 'c2', contactName: 'Fernanda Castro', contactCompany: 'Castro & Associados',
    contactPhone: '21976543210', type: 'positive_response',
    message: 'Fernanda perguntou sobre parceria mensal. Oportunidade quente!',
    createdAt: d(2), isRead: false,
  },
  {
    id: 'n2', contactId: 'c3', contactName: 'Bruno Teixeira', contactCompany: 'BT Soluções',
    contactPhone: '31965432109', type: 'followup_needed',
    message: 'Sem resposta há 8 dias. Follow-up #2 pendente.',
    createdAt: now, isRead: false,
  },
  {
    id: 'n3', contactId: 'c1', contactName: 'Roberto Fernandes', contactCompany: 'RF Engenharia',
    contactPhone: '11987654321', type: 'converted',
    message: 'Roberto Fernandes convertido! Reunião agendada com comercial.',
    createdAt: d(3), isRead: true,
  },
];

// ============== TEMPLATES (default for new users) ==============
export const defaultTemplates: Omit<MessageTemplate, 'userId'>[] = [
  {
    id: 'tpl_initial', name: 'Apresentação Inicial', type: 'initial',
    content: 'Olá [Nome]! 👋\n\nSou da [Empresa] e gostaria de apresentar nossas soluções para a [EmpresaContato].\n\nAcreditamos que podemos colaborar de forma estratégica. Tem um momento para uma conversa rápida?',
    variables: ['Nome', 'Empresa', 'EmpresaContato'],
  },
  {
    id: 'tpl_fu1', name: 'Follow-up 1', type: 'followup_1',
    content: 'Olá [Nome]! 😊\n\nPassando para retomar o contato. Enviamos uma mensagem há alguns dias sobre uma possível parceria com a [EmpresaContato].\n\nA agenda é corrida, entendemos! Que tal uma conversa de 15 minutos? Podemos nos adaptar ao seu horário. 📅',
    variables: ['Nome', 'Empresa', 'EmpresaContato'],
  },
  {
    id: 'tpl_fu2', name: 'Follow-up 2', type: 'followup_2',
    content: 'Oi [Nome]! 🚀\n\nSó mais uma mensagem da [Empresa]. Nossos clientes parceiros têm acesso a:\n\n✅ Atendimento dedicado\n✅ Condições comerciais exclusivas\n✅ Suporte técnico especializado\n\nSe tiver interesse, é só responder aqui!',
    variables: ['Nome', 'Empresa'],
  },
  {
    id: 'tpl_fu3', name: 'Follow-up 3', type: 'followup_3',
    content: 'Olá [Nome]! Esta é nossa última mensagem. 🙂\n\nCaso queira saber mais sobre a [Empresa] no futuro, estaremos aqui.\n\nTenha uma ótima semana! 🤝',
    variables: ['Nome', 'Empresa'],
  },
];

// ============== ADMIN STATS ==============
export const adminStats = {
  mrr: 4_076,
  mrrGrowth: 12.4,
  totalUsers: mockUsers.filter(u => u.role === 'user').length,
  activeUsers: mockUsers.filter(u => u.subscriptionStatus === 'active').length,
  churnRate: 3.2,
  trialUsers: mockUsers.filter(u => u.subscriptionStatus === 'trial').length,
  planDistribution: {
    starter: mockUsers.filter(u => u.planId === 'starter' && u.role === 'user').length,
    pro: mockUsers.filter(u => u.planId === 'pro' && u.role === 'user').length,
    business: mockUsers.filter(u => u.planId === 'business' && u.role === 'user').length,
  },
  revenueByMonth: [
    { month: 'Nov', revenue: 2840 },
    { month: 'Dez', revenue: 3120 },
    { month: 'Jan', revenue: 3480 },
    { month: 'Fev', revenue: 3650 },
    { month: 'Mar', revenue: 3890 },
    { month: 'Abr', revenue: 4076 },
  ],
  newUsersByMonth: [
    { month: 'Nov', users: 4 },
    { month: 'Dez', users: 6 },
    { month: 'Jan', users: 5 },
    { month: 'Fev', users: 8 },
    { month: 'Mar', users: 7 },
    { month: 'Abr', users: 9 },
  ],
};
