import type { Prospect, Notification, MessageTemplate } from '@/lib/index';
import { addDays } from '@/lib/index';

const now = new Date();
const d = (daysAgo: number) => new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

// ===================== MESSAGE TEMPLATES =====================
export const messageTemplates: MessageTemplate[] = [
  {
    id: 'tpl_initial',
    name: 'Apresentação Inicial',
    type: 'initial',
    content:
      'Olá [Nome]! 👋\n\nSomos a [Construtora], construtora especializada em projetos residenciais e comerciais de alto padrão.\n\nGostaríamos muito de apresentar nossas soluções e explorar uma parceria com o escritório [Escritório]. Temos condições especiais para arquitetos parceiros.\n\nPodemos conversar?',
    variables: ['Nome', 'Construtora', 'Escritório'],
  },
  {
    id: 'tpl_followup_1',
    name: 'Follow-up 1',
    type: 'followup_1',
    content:
      'Olá [Nome]! 😊\n\nPassando para retomar o contato. Somos a [Construtora] e enviamos uma mensagem há alguns dias sobre uma possível parceria com o [Escritório].\n\nSabemos que a agenda é corrida! Se preferir, podemos agendar uma conversa rápida de 15 minutos em um horário melhor para você. 📅',
    variables: ['Nome', 'Construtora', 'Escritório'],
  },
  {
    id: 'tpl_followup_2',
    name: 'Follow-up 2',
    type: 'followup_2',
    content:
      'Oi [Nome], tudo bem? 🏗️\n\nÚltimo recado da [Construtora]! Nossos clientes arquitetos têm acesso a:\n\n✅ Acompanhamento técnico dedicado\n✅ Materiais de alta qualidade\n✅ Prazo rigoroso de entrega\n✅ Programa de indicação com benefícios\n\nSe tiver interesse, é só responder aqui! Caso prefira não ser contactado, sem problemas. 🙏',
    variables: ['Nome', 'Construtora'],
  },
  {
    id: 'tpl_followup_3',
    name: 'Follow-up 3 (Final)',
    type: 'followup_3',
    content:
      'Olá [Nome]! Esta é nossa última mensagem. 🙂\n\nSe em algum momento precisar de uma construtora confiável para seus projetos, lembre-se da [Construtora].\n\nFicamos à disposição! Tenha uma ótima semana. 👷',
    variables: ['Nome', 'Construtora'],
  },
];

// ===================== COMPANY SETTINGS =====================
export const companySettings = {
  name: 'Construtora Exemplo',
  followUpDays: 3,
  maxFollowUps: 3,
};

// ===================== PROSPECTS (MOCK DATA) =====================
export const initialProspects: Prospect[] = [
  {
    id: 'p1',
    name: 'Carlos Mendes',
    office: 'CM Arquitetura',
    phone: '11987654321',
    city: 'São Paulo',
    state: 'SP',
    specialization: 'Residencial alto padrão',
    email: 'carlos@cmarquitetura.com.br',
    status: 'convertido',
    createdAt: d(20),
    lastContactAt: d(3),
    nextFollowUpAt: null,
    followUpCount: 1,
    maxFollowUps: 3,
    assignedTo: 'Ana Lima',
    isPositiveResponse: true,
    notes: 'Interesse em parceria para 3 projetos no Morumbi.',
    messages: [
      {
        id: 'm1',
        type: 'sent',
        content:
          'Olá Carlos! 👋\n\nSomos a Construtora Exemplo, especializada em projetos residenciais e comerciais de alto padrão.\n\nGostaríamos muito de apresentar nossas soluções e explorar uma parceria com o escritório CM Arquitetura. Temos condições especiais para arquitetos parceiros.\n\nPodemos conversar?',
        timestamp: d(20),
        status: 'read',
      },
      {
        id: 'm2',
        type: 'received',
        content: 'Olá! Claro, tenho interesse sim. Pode me enviar mais informações sobre a construtora?',
        timestamp: d(18),
        status: 'read',
      },
      {
        id: 'm3',
        type: 'sent',
        content:
          'Que ótimo, Carlos! Vou pedir que nosso consultor comercial entre em contato com você para agendar uma apresentação completa. Qual o melhor horário?',
        timestamp: d(17),
        status: 'read',
      },
      {
        id: 'm4',
        type: 'received',
        content: 'Prefiro às terças ou quintas, após as 14h. Pode ser essa semana.',
        timestamp: d(16),
        status: 'read',
      },
    ],
  },
  {
    id: 'p2',
    name: 'Fernanda Rocha',
    office: 'Studio Rocha',
    phone: '21976543210',
    city: 'Rio de Janeiro',
    state: 'RJ',
    specialization: 'Interiores comerciais',
    email: 'fernanda@studiorocha.arq',
    status: 'respondido',
    createdAt: d(10),
    lastContactAt: d(2),
    nextFollowUpAt: null,
    followUpCount: 0,
    maxFollowUps: 3,
    assignedTo: 'Pedro Costa',
    isPositiveResponse: true,
    notes: 'Quer saber sobre prazos de entrega para projeto no centro.',
    messages: [
      {
        id: 'm5',
        type: 'sent',
        content:
          'Olá Fernanda! 👋\n\nSomos a Construtora Exemplo, especializada em projetos residenciais e comerciais de alto padrão.\n\nGostaríamos muito de apresentar nossas soluções e explorar uma parceria com o Studio Rocha. Temos condições especiais para arquitetos parceiros.\n\nPodemos conversar?',
        timestamp: d(10),
        status: 'read',
      },
      {
        id: 'm6',
        type: 'received',
        content:
          'Oi! Sim, tenho um projeto para shopping no centro do Rio. Quais são os prazos médios de vocês para obras comerciais?',
        timestamp: d(2),
        status: 'read',
      },
    ],
  },
  {
    id: 'p3',
    name: 'Ricardo Alves',
    office: 'Alves & Sócios Arquitetura',
    phone: '31965432109',
    city: 'Belo Horizonte',
    state: 'MG',
    specialization: 'Projetos corporativos',
    status: 'followup',
    createdAt: d(8),
    lastContactAt: d(8),
    nextFollowUpAt: addDays(now, 0),
    followUpCount: 1,
    maxFollowUps: 3,
    isPositiveResponse: false,
    messages: [
      {
        id: 'm7',
        type: 'sent',
        content:
          'Olá Ricardo! 👋\n\nSomos a Construtora Exemplo, especializada em projetos residenciais e comerciais de alto padrão.\n\nGostaríamos muito de apresentar nossas soluções e explorar uma parceria com o Alves & Sócios. Temos condições especiais para arquitetos parceiros.\n\nPodemos conversar?',
        timestamp: d(8),
        status: 'delivered',
      },
      {
        id: 'm8',
        type: 'sent',
        content:
          'Olá Ricardo! 😊\n\nPassando para retomar o contato. Somos a Construtora Exemplo e enviamos uma mensagem há alguns dias sobre uma possível parceria.\n\nSabemos que a agenda é corrida! Se preferir, podemos agendar uma conversa rápida de 15 minutos em um horário melhor para você. 📅',
        timestamp: d(5),
        status: 'delivered',
        isFollowUp: true,
        followUpNumber: 1,
      },
    ],
  },
  {
    id: 'p4',
    name: 'Juliana Santos',
    office: 'JS Design Studio',
    phone: '51954321098',
    city: 'Porto Alegre',
    state: 'RS',
    specialization: 'Residencial',
    status: 'followup',
    createdAt: d(6),
    lastContactAt: d(6),
    nextFollowUpAt: addDays(now, 1),
    followUpCount: 0,
    maxFollowUps: 3,
    isPositiveResponse: false,
    messages: [
      {
        id: 'm9',
        type: 'sent',
        content:
          'Olá Juliana! 👋\n\nSomos a Construtora Exemplo, especializada em projetos residenciais e comerciais de alto padrão.\n\nGostaríamos de apresentar nossas soluções e explorar uma parceria com o JS Design Studio. Temos condições especiais para arquitetos parceiros.\n\nPodemos conversar?',
        timestamp: d(6),
        status: 'delivered',
      },
    ],
  },
  {
    id: 'p5',
    name: 'Marcelo Teixeira',
    office: 'Teixeira Arquitetura',
    phone: '41943210987',
    city: 'Curitiba',
    state: 'PR',
    specialization: 'Projetos sustentáveis',
    status: 'aguardando',
    createdAt: d(1),
    lastContactAt: d(1),
    nextFollowUpAt: addDays(now, 2),
    followUpCount: 0,
    maxFollowUps: 3,
    isPositiveResponse: false,
    messages: [
      {
        id: 'm10',
        type: 'sent',
        content:
          'Olá Marcelo! 👋\n\nSomos a Construtora Exemplo, especializada em projetos residenciais e comerciais de alto padrão.\n\nGostaríamos de apresentar nossas soluções e explorar uma parceria com a Teixeira Arquitetura. Temos condições especiais para arquitetos parceiros.\n\nPodemos conversar?',
        timestamp: d(1),
        status: 'sent',
      },
    ],
  },
  {
    id: 'p6',
    name: 'Camila Nunes',
    office: 'Nunes & Associados',
    phone: '47932109876',
    city: 'Florianópolis',
    state: 'SC',
    specialization: 'Hotelaria e turismo',
    status: 'aguardando',
    createdAt: now,
    lastContactAt: now,
    nextFollowUpAt: addDays(now, 3),
    followUpCount: 0,
    maxFollowUps: 3,
    isPositiveResponse: false,
    messages: [
      {
        id: 'm11',
        type: 'sent',
        content:
          'Olá Camila! 👋\n\nSomos a Construtora Exemplo, especializada em projetos residenciais e comerciais de alto padrão.\n\nGostaríamos de apresentar nossas soluções e explorar uma parceria com a Nunes & Associados. Temos condições especiais para arquitetos parceiros.\n\nPodemos conversar?',
        timestamp: now,
        status: 'sent',
      },
    ],
  },
  {
    id: 'p7',
    name: 'Bruno Lima',
    office: 'Lima Arquitetos',
    phone: '85921098765',
    city: 'Fortaleza',
    state: 'CE',
    specialization: 'Residencial médio padrão',
    status: 'arquivado',
    createdAt: d(30),
    lastContactAt: d(10),
    nextFollowUpAt: null,
    followUpCount: 3,
    maxFollowUps: 3,
    isPositiveResponse: false,
    notes: 'Sem resposta após 3 follow-ups. Arquivado.',
    messages: [
      {
        id: 'm12',
        type: 'sent',
        content: 'Olá Bruno! Somos a Construtora Exemplo...',
        timestamp: d(30),
        status: 'delivered',
      },
      {
        id: 'm13',
        type: 'sent',
        content: 'Follow-up 1...',
        timestamp: d(27),
        status: 'delivered',
        isFollowUp: true,
        followUpNumber: 1,
      },
      {
        id: 'm14',
        type: 'sent',
        content: 'Follow-up 2...',
        timestamp: d(24),
        status: 'delivered',
        isFollowUp: true,
        followUpNumber: 2,
      },
      {
        id: 'm15',
        type: 'sent',
        content: 'Follow-up 3 (final)...',
        timestamp: d(21),
        status: 'delivered',
        isFollowUp: true,
        followUpNumber: 3,
      },
    ],
  },
  {
    id: 'p8',
    name: 'Patricia Moura',
    office: 'Moura Arquitetura & Design',
    phone: '11912345678',
    city: 'São Paulo',
    state: 'SP',
    specialization: 'Luxo e alto padrão',
    status: 'respondido',
    createdAt: d(5),
    lastContactAt: d(1),
    nextFollowUpAt: null,
    followUpCount: 0,
    maxFollowUps: 3,
    assignedTo: 'Ana Lima',
    isPositiveResponse: true,
    notes: 'Interessada em ver portfolio. Aguardando comercial.',
    messages: [
      {
        id: 'm16',
        type: 'sent',
        content:
          'Olá Patricia! 👋\n\nSomos a Construtora Exemplo, especializada em projetos residenciais e comerciais de alto padrão.\n\nGostaríamos de apresentar nossas soluções e explorar uma parceria com a Moura Arquitetura & Design. Temos condições especiais para arquitetos parceiros.\n\nPodemos conversar?',
        timestamp: d(5),
        status: 'read',
      },
      {
        id: 'm17',
        type: 'received',
        content:
          'Olá! Que ótimo! Tenho alguns clientes que estão buscando construtoras para seus projetos. Podem me enviar o portfólio de obras?',
        timestamp: d(1),
        status: 'read',
      },
    ],
  },
];

// ===================== NOTIFICATIONS =====================
export const initialNotifications: Notification[] = [
  {
    id: 'n1',
    prospectId: 'p8',
    prospectName: 'Patricia Moura',
    prospectOffice: 'Moura Arquitetura & Design',
    prospectPhone: '11912345678',
    type: 'positive_response',
    message:
      'Patricia Moura respondeu positivamente e solicitou o portfólio. Encaminhar para equipe comercial.',
    createdAt: d(1),
    isRead: false,
    assignedTo: 'Ana Lima',
  },
  {
    id: 'n2',
    prospectId: 'p2',
    prospectName: 'Fernanda Rocha',
    prospectOffice: 'Studio Rocha',
    prospectPhone: '21976543210',
    type: 'positive_response',
    message:
      'Fernanda Rocha perguntou sobre prazos para obra comercial no Rio. Oportunidade quente!',
    createdAt: d(2),
    isRead: false,
    assignedTo: 'Pedro Costa',
  },
  {
    id: 'n3',
    prospectId: 'p3',
    prospectName: 'Ricardo Alves',
    prospectOffice: 'Alves & Sócios Arquitetura',
    prospectPhone: '31965432109',
    type: 'followup_needed',
    message: 'Sem resposta há 5 dias. Follow-up #2 pendente para hoje.',
    createdAt: now,
    isRead: false,
  },
  {
    id: 'n4',
    prospectId: 'p1',
    prospectName: 'Carlos Mendes',
    prospectOffice: 'CM Arquitetura',
    prospectPhone: '11987654321',
    type: 'converted',
    message: 'Carlos Mendes convertido! Reunião agendada com equipe comercial.',
    createdAt: d(3),
    isRead: true,
    assignedTo: 'Ana Lima',
  },
];
