// ============================================================
// Evolution API — MOCK (Simulado para Zapli Agent)
// ============================================================

export const IS_CONFIGURED = true;

export function buildInstanceName(tenantId: string): string {
  return `zapli-${tenantId.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
}

export type InstanceState = 'open' | 'connecting' | 'close' | 'refused';

export interface InstanceStatus {
  instance:     string;
  state:        InstanceState;
  profileName?: string;
  profilePic?:  string;
  phone?:       string;
}

export interface QRCodeResponse {
  code:  string;
  count: number;
  base64?: string;
}

export interface SendTextPayload {
  phone:    string;
  text:     string;
  delayMs?: number;
}

export interface SendTextResponse {
  key: { remoteJid: string; fromMe: boolean; id: string };
  status: 'PENDING' | 'SERVER_ACK' | 'DELIVERY_ACK' | 'READ' | 'ERROR';
}

export function phoneFromJid(jid: string): string {
  return jid.replace('@s.whatsapp.net', '').replace('@g.us', '').replace(/^55/, '');
}

export function formatPhoneForEvolution(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('55') ? digits : `55${digits}`;
}

// --------------- MOCK IMPLEMENTATIONS -------------------

export async function createInstance(instanceName: string): Promise<any> {
  console.log('[Mock] Create instance:', instanceName);
  return { instance: { instanceName, status: 'created' } };
}

export async function getInstanceStatus(instanceName: string): Promise<InstanceStatus> {
  // Simula que está sempre aberto para não travar a UI
  return {
    instance: instanceName,
    state: 'open',
    profileName: 'Zapli Agent',
    phone: '5500000000000'
  };
}

export async function getQRCode(instanceName: string): Promise<QRCodeResponse> {
  return { code: 'mock-qr', count: 0, base64: '' };
}

export async function disconnectInstance(instanceName: string): Promise<void> {
  console.log('[Mock] Disconnect instance:', instanceName);
}

export async function sendText(payload: SendTextPayload, instanceName: string): Promise<SendTextResponse> {
  console.log('[Mock] Sending message to', payload.phone, ':', payload.text);
  // Simula um pequeno delay de rede
  await new Promise(r => setTimeout(r, 1000));
  
  return {
    key: { remoteJid: `${payload.phone}@s.whatsapp.net`, fromMe: true, id: Math.random().toString(36).substring(7) },
    status: 'SERVER_ACK'
  };
}

export function isPositiveResponse(text: string): boolean {
  const t = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const positivePatterns = [
    /\bsim\b/, /\bpode\b/, /\bquero\b/, /\bqueria\b/, /\binteresse\b/,
    /\bme manda\b/, /\bme passa\b/, /\bagendar\b/, /\breuniao\b/,
    /\btopei\b/, /\bvamos\b/, /\bme interessa\b/, /\bme conta\b/,
    /\bme fala\b/, /\bfala mais\b/, /\bcom certeza\b/, /\bclaro\b/,
    /\bpor favor\b/, /\bquanto custa\b/, /\bpreco\b/, /\bvalor\b/,
  ];
  return positivePatterns.some(p => p.test(t));
}
