import type { Product, QueueItem, SendSettings } from '@/lib/index';

const now = new Date();

// ============ DEFAULT PRODUCTS ============
export const defaultProducts: Product[] = [
  {
    id: 'prod1',
    userId: 'u1',
    name: 'Serviço de Construção Residencial',
    description: 'Obras residenciais completas com acabamento premium',
    category: 'Construção',
    color: '#6366f1',
    createdAt: new Date(now.getTime() - 30 * 86400000),
    templates: {
      initial: 'Olá [Nome]! 👋\n\nSou da [Empresa] e trabalhamos com *construção residencial de alto padrão*.\n\nGostaria de apresentar nossos serviços para a [EmpresaContato]. Atendemos projetos residenciais com qualidade premium e prazo garantido.\n\nPosso te enviar nosso portfólio?',
      followup_1: 'Oi [Nome]! 😊\n\nPassando para retomar o contato sobre nossos serviços de *construção residencial*.\n\nSabemos que a agenda é corrida, mas seria ótimo conversar 15 minutinhos. Quando ficaria bom para você? 📅',
      followup_2: 'Olá [Nome]! 🏗️\n\nSó mais uma mensagem sobre a [Empresa]. Para nossos parceiros em construção residencial oferecemos:\n\n✅ Prazo garantido contratualmente\n✅ Materiais certificados\n✅ Engenheiro dedicado\n✅ Seguro total da obra\n\nTem interesse?',
      followup_3: 'Oi [Nome], última mensagem! 🙂\n\nSe precisar de uma construtora confiável para projetos residenciais, lembre-se da [Empresa]. Estamos sempre aqui! 🤝',
    },
  },
  {
    id: 'prod2',
    userId: 'u1',
    name: 'Parceria com Escritórios de Arquitetura',
    description: 'Programa de parceria com honorários e benefícios exclusivos',
    category: 'Parceria',
    color: '#10b981',
    createdAt: new Date(now.getTime() - 20 * 86400000),
    templates: {
      initial: 'Olá [Nome]! 👋\n\nSou da [Empresa] e temos um *programa exclusivo para escritórios de arquitetura*.\n\nOfertamos honorários diferenciados, acompanhamento técnico e parceria em projetos para o [EmpresaContato].\n\nPodemos conversar sobre uma parceria?',
      followup_1: 'Oi [Nome]! 😊\n\nRetomando o contato sobre nossa *parceria para arquitetos*. Nosso programa inclui benefícios exclusivos que muitos escritórios já aproveitam.\n\nQual o melhor horário para uma conversa rápida?',
      followup_2: 'Olá [Nome]! ✨\n\nNosso programa de parceria para arquitetos inclui:\n\n🎯 Honorários acima do mercado\n🏗️ Suporte técnico dedicado\n📋 Gestão transparente de obra\n🤝 Indicações recíprocas\n\nTem interesse em saber mais?',
      followup_3: 'Oi [Nome], última mensagem! 🙂\n\nCaso queira uma construtora parceira no futuro, a [Empresa] está aqui. Sucesso nos seus projetos! 🏛️',
    },
  },
];

// ============ DEFAULT SEND SETTINGS ============
export const defaultSendSettings: SendSettings = {
  messagesPerDay: 80,
  messagesPerHour: 15,
  minDelaySeconds: 45,
  maxDelaySeconds: 120,
  sendingHoursStart: 8,
  sendingHoursEnd: 20,
  daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
  warmUpMode: false,
};

// ============ ANTI-BLOCKING RULES ============
export const ANTI_BLOCKING_RULES = [
  { icon: '⏱️', title: 'Delay aleatório entre mensagens', desc: 'Intervalo de 45 a 120 segundos entre cada envio — simula comportamento humano' },
  { icon: '📅', title: 'Limite diário inteligente', desc: 'Máximo de 80 mensagens/dia por padrão (configurável). Distribui ao longo do dia' },
  { icon: '🕐', title: 'Horário comercial apenas', desc: 'Envia somente entre 8h–20h, evitando mensagens fora do horário' },
  { icon: '📆', title: 'Dias úteis por padrão', desc: 'Seg–Sex apenas. Fins de semana são mais arriscados para bloqueio' },
  { icon: '🔥', title: 'Modo Aquecimento', desc: 'Para números novos: começa com 10/dia e aumenta gradualmente em 2 semanas' },
  { icon: '🎲', title: 'Variação de texto', desc: 'Pequenas variações automáticas nas mensagens evitam detecção de spam' },
  { icon: '🛑', title: 'Pausa automática', desc: 'Se detectar 3 erros seguidos, pausa o envio por 2h para proteger o número' },
  { icon: '👤', title: 'Simulação humanizada', desc: 'Simula tempo de digitação variável antes de cada envio' },
];

// ============ QUEUE MOCK DATA ============
export function generateMockQueue(contacts: { id: string; name: string; phone: string; company: string }[], productName?: string): QueueItem[] {
  const now2 = new Date();
  return contacts.slice(0, 8).map((c, i) => {
    const scheduled = new Date(now2.getTime() + i * 75 * 1000); // ~75s each
    return {
      id: `q_${c.id}`,
      contactId: c.id,
      contactName: c.name,
      contactPhone: c.phone,
      contactCompany: c.company,
      messageType: 'initial' as const,
      productName,
      message: `Mensagem inicial para ${c.name}...`,
      status: (i < 2 ? 'sent' : i === 2 ? 'sending' : 'pending') as QueueItem['status'],
      scheduledAt: scheduled,
      sentAt: i < 2 ? new Date(now2.getTime() - (3 - i) * 75 * 1000) : undefined,
    };
  });
}
