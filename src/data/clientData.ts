import type { Client } from '@/lib/index';

const now = new Date();
const d = (days: number) => new Date(now.getTime() - days * 86400000);
const f = (days: number) => new Date(now.getTime() + days * 86400000);

export const mockClients: Client[] = [
  {
    id: 'cl1', userId: 'u1', dealId: 'd1', contactId: 'c1',
    companyName: 'RF Engenharia', cnpj: '12.345.678/0001-90',
    segment: 'Engenharia Civil', website: 'rfengenharia.com.br',
    city: 'São Paulo', state: 'SP', address: 'Av. Paulista, 1000 — Bela Vista',
    employeeCount: '11-50', annualRevenue: 'R$ 1M–5M',
    contacts: [
      { id: 'cc1', name: 'Roberto Fernandes', role: 'Sócio-Fundador', phone: '11987654321', email: 'roberto@rfeng.com.br', isPrimary: true, whatsapp: '11987654321' },
      { id: 'cc2', name: 'Patricia Ramos', role: 'Diretora Comercial', phone: '11976543210', email: 'patricia@rfeng.com.br', isPrimary: false },
    ],
    status: 'ativo', healthScore: 87, ltv: 185000, mrr: 15000,
    acquisitionDate: d(45), lastInteractionAt: d(2), nextFollowUpAt: f(12),
    fromProspecting: true, productName: 'Parceria com Escritórios de Arquitetura',
    tags: ['premium', 'parceiro-estratégico', 'sp'],
    notes: 'Cliente prioritário. Três obras em andamento no Morumbi. Potencial de expansão para 2026.',
    products: [
      { productName: 'Construção Residencial Premium', quantity: 1, unitValue: 850000, totalValue: 850000, status: 'ativo', startDate: d(40), renewalDate: f(325), notes: 'Obra Morumbi — prazo 12 meses' },
      { productName: 'Consultoria Técnica Mensal', quantity: 1, unitValue: 15000, totalValue: 15000, status: 'ativo', startDate: d(40), renewalDate: f(5) },
    ],
    proposals: [
      { id: 'p1', title: 'Proposta Construção Residencial — Morumbi', value: 850000, status: 'aprovada', sentAt: d(50), validUntil: d(20), fileName: 'proposta_rf_morumbi_v2.pdf', createdAt: d(52) },
      { id: 'p2', title: 'Expansão — 2 novas obras SP 2026', value: 1200000, status: 'enviada', sentAt: d(5), validUntil: f(25), fileName: 'proposta_rf_expansao_2026.pdf', createdAt: d(6) },
    ],
    interactions: [
      { id: 'i1', type: 'reuniao', title: 'Reunião de kick-off', description: 'Alinhamento do projeto, cronograma e equipe.', date: d(40), outcome: 'positivo' },
      { id: 'i2', type: 'whatsapp', title: 'Follow-up semanal', description: 'Atualização sobre andamento da obra.', date: d(7), outcome: 'positivo' },
      { id: 'i3', type: 'proposta', title: 'Nova proposta enviada', description: 'Expansão para 2026 — 2 novas obras.', date: d(5), outcome: 'neutro' },
    ],
    createdAt: d(45), updatedAt: d(2),
  },
  {
    id: 'cl2', userId: 'u1',
    companyName: 'Castro & Associados', cnpj: '98.765.432/0001-10',
    segment: 'Consultoria Jurídica', website: 'castroassociados.adv.br',
    city: 'Rio de Janeiro', state: 'RJ',
    employeeCount: '1-10', annualRevenue: 'R$ 500K–1M',
    contacts: [
      { id: 'cc3', name: 'Fernanda Castro', role: 'Sócia-Fundadora', phone: '21976543210', email: 'fernanda@castroassociados.adv.br', isPrimary: true },
    ],
    status: 'ativo', healthScore: 72, ltv: 42000, mrr: 8500,
    acquisitionDate: d(20), lastInteractionAt: d(3),
    fromProspecting: true,
    tags: ['rj', 'recorrente'],
    notes: 'Parceria mensal de consultoria. Interesse em ampliar o escopo.',
    products: [
      { productName: 'Consultoria Técnica Mensal', quantity: 1, unitValue: 8500, totalValue: 8500, status: 'ativo', startDate: d(20), renewalDate: f(10) },
    ],
    proposals: [
      { id: 'p3', title: 'Parceria Consultoria Mensal', value: 8500, status: 'aprovada', sentAt: d(22), fileName: 'proposta_castro_mensal.pdf', createdAt: d(23) },
    ],
    interactions: [
      { id: 'i4', type: 'ligacao', title: 'Onboarding telefônico', date: d(19), outcome: 'positivo' },
      { id: 'i5', type: 'email', title: 'Envio de relatório mensal', date: d(3), outcome: 'positivo' },
    ],
    createdAt: d(20), updatedAt: d(3),
  },
  {
    id: 'cl3', userId: 'u1',
    companyName: 'Vieira & Filhos Ltda.', cnpj: '45.678.901/0001-23',
    segment: 'Indústria Metalmecânica', city: 'Curitiba', state: 'PR',
    employeeCount: '51-200', annualRevenue: 'R$ 5M–20M',
    contacts: [
      { id: 'cc4', name: 'Marcos Vieira', role: 'CEO', phone: '41943210987', email: 'marcos@vieirafilhos.com.br', isPrimary: true },
      { id: 'cc5', name: 'Guilherme Vieira', role: 'Diretor de Operações', phone: '41932109876', isPrimary: false },
    ],
    status: 'em_risco', healthScore: 41, ltv: 95000, mrr: 0,
    acquisitionDate: d(90), lastInteractionAt: d(30),
    fromProspecting: false,
    tags: ['pr', 'grande-porte', 'em-risco'],
    notes: 'Sem resposta há 30 dias. Verificar se há insatisfação com serviço.',
    products: [
      { productName: 'Construção Residencial Premium', quantity: 1, unitValue: 95000, totalValue: 95000, status: 'concluido', startDate: d(90), endDate: d(10) },
    ],
    proposals: [
      { id: 'p4', title: 'Renovação contrato 2026', value: 120000, status: 'enviada', sentAt: d(15), validUntil: f(15), fileName: 'proposta_vieira_renovacao_2026.pdf', createdAt: d(16) },
    ],
    interactions: [
      { id: 'i6', type: 'reuniao', title: 'Encerramento do projeto', date: d(10), outcome: 'neutro' },
    ],
    createdAt: d(90), updatedAt: d(10),
  },
];
