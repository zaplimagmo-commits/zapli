// ============================================================
// Evolution API — Cliente completo para o Zapli
// Docs: https://doc.evolution-api.com
// ============================================================

// --------------- Configuração -----------------------
// Lê as variáveis de ambiente (Vite expõe VITE_* para o frontend).
// Se não estiverem definidas, usa valores de demonstração (mock).

const BASE_URL = import.meta.env.VITE_EVOLUTION_URL ?? '';
const API_KEY  = import.meta.env.VITE_EVOLUTION_KEY ?? '';

export const IS_CONFIGURED = !!(BASE_URL && API_KEY);

/** Gera o nome da instância a partir do tenantId da empresa */
export function buildInstanceName(tenantId: string): string {
  return `zapli-${tenantId.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
}

// --------------- Tipos ------------------------------

export type InstanceState =
  | 'open'        // conectado ✅
  | 'connecting'  // aguardando QR
  | 'close'       // desconectado
  | 'refused';    // número banido / recusado

export interface InstanceStatus {
  instance:     string;
  state:        InstanceState;
  profileName?: string;
  profilePic?:  string;
  phone?:       string;
}

export interface QRCodeResponse {
  code:  string;  // string base64 para exibir como <img src="data:image/png;base64,..." />
  count: number;
}

export interface SendTextPayload {
  phone:    string;   // apenas dígitos, sem +55 — ex: "11987654321"
  text:     string;
  delayMs?: number;   // delay antes de enviar (simula digitação)
}

export interface SendTextResponse {
  key: {
    remoteJid: string;
    fromMe:    boolean;
    id:        string;
  };
  status: 'PENDING' | 'SERVER_ACK' | 'DELIVERY_ACK' | 'READ' | 'ERROR';
}

/** Evento de mensagem recebida via Webhook */
export interface WebhookMessageEvent {
  event:    'messages.upsert';
  instance: string;
  data: {
    key: {
      remoteJid: string;   // "5511999990001@s.whatsapp.net"
      fromMe:    boolean;
      id:        string;
    };
    pushName?:   string;
    message: {
      conversation?: string;   // texto plano
      extendedTextMessage?: {
        text: string;
      };
    };
    messageTimestamp: number;
  };
}

/** Evento de atualização de status de mensagem enviada */
export interface WebhookStatusEvent {
  event:    'messages.update';
  instance: string;
  data: {
    key: { id: string; fromMe: boolean };
    update: { status: 'DELIVERY_ACK' | 'READ' | 'SERVER_ACK' };
  };
}

/** Evento de mudança de estado da conexão */
export interface WebhookConnectionEvent {
  event:    'connection.update';
  instance: string;
  data: {
    state: InstanceState;
  };
}

// --------------- Helpers internos -------------------

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  if (!IS_CONFIGURED) {
    throw new Error('Evolution API não configurada. Defina VITE_EVOLUTION_URL e VITE_EVOLUTION_KEY no .env');
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'apikey': API_KEY,
      ...(options?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Evolution API ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

/** Extrai número de telefone limpo do JID do WhatsApp */
export function phoneFromJid(jid: string): string {
  // "5511999990001@s.whatsapp.net" → "11999990001"
  return jid.replace('@s.whatsapp.net', '').replace('@g.us', '').replace(/^55/, '');
}

/** Formata número para o formato da Evolution API: "55" + dígitos */
export function formatPhoneForEvolution(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('55') ? digits : `55${digits}`;
}

// --------------- Instância --------------------------

/** Cria instância exclusiva para a empresa (tenantId → zapli-{tenantId}) */
export async function createInstance(instanceName: string): Promise<{ instance: { instanceName: string; status: string } }> {
  return apiFetch('/instance/create', {
    method: 'POST',
    body: JSON.stringify({ instanceName, qrcode: true, integration: 'WHATSAPP-BAILEYS' }),
  });
}

/** Status da instância (conectado / desconectado / aguardando QR) */
export async function getInstanceStatus(instanceName: string): Promise<InstanceStatus> {
  const data = await apiFetch<{ instance: InstanceStatus }>(`/instance/connectionState/${instanceName}`);
  return data.instance;
}

/** QR Code para conectar o WhatsApp da empresa */
export async function getQRCode(instanceName: string): Promise<QRCodeResponse> {
  return apiFetch<QRCodeResponse>(`/instance/connect/${instanceName}`);
}

/** Desconecta o WhatsApp da empresa (logout) */
export async function disconnectInstance(instanceName: string): Promise<void> {
  await apiFetch(`/instance/logout/${instanceName}`, { method: 'DELETE' });
}

/** Remove completamente a instância da empresa do servidor */
export async function deleteInstance(instanceName: string): Promise<void> {
  await apiFetch(`/instance/delete/${instanceName}`, { method: 'DELETE' });
}

// --------------- Envio de mensagens -----------------

/**
 * Envia mensagem de texto simples.
 *
 * @param payload.phone   Número destino (só dígitos, sem +55)
 * @param payload.text    Texto a enviar (suporta *negrito*, _itálico_, ~tachado~)
 * @param payload.delayMs Delay antes de enviar em ms (padrão: 1200ms = simula digitação)
 */
export async function sendText(payload: SendTextPayload, instanceName: string): Promise<SendTextResponse> {
  return apiFetch<SendTextResponse>(`/message/sendText/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({
      number:  formatPhoneForEvolution(payload.phone),
      options: {
        delay:    payload.delayMs ?? 1200,
        presence: 'composing',   // mostra "digitando..." antes de enviar
      },
      textMessage: {
        text: payload.text,
      },
    }),
  });
}

/**
 * Envia múltiplas mensagens em sequência com delay entre elas.
 * Respeita as configurações anti-bloqueio.
 *
 * @param messages    Lista de {phone, text}
 * @param minDelay    Delay mínimo entre msgs em ms (padrão 45s)
 * @param maxDelay    Delay máximo entre msgs em ms (padrão 120s)
 * @param onProgress  Callback chamado após cada envio: (index, total, phone, ok)
 */
export async function sendBatch(
  messages: Array<{ phone: string; text: string }>,
  instanceName: string,
  minDelay = 45_000,
  maxDelay = 120_000,
  onProgress?: (index: number, total: number, phone: string, success: boolean) => void,
): Promise<{ sent: number; failed: number; errors: string[] }> {
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < messages.length; i++) {
    const { phone, text } = messages[i];
    try {
      await sendText({ phone, text, delayMs: 1200 }, instanceName);
      sent++;
      onProgress?.(i, messages.length, phone, true);
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${phone}: ${msg}`);
      onProgress?.(i, messages.length, phone, false);
    }

    // Delay anti-bloqueio entre mensagens (exceto na última)
    if (i < messages.length - 1) {
      const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
      await sleep(delay);
    }
  }

  return { sent, failed, errors };
}

// --------------- Webhook ----------------------------

/**
 * Configura o URL de webhook para receber eventos em tempo real.
 * Chame isso UMA VEZ durante a configuração inicial.
 *
 * @param webhookUrl URL público do seu backend que receberá os eventos
 */
export async function setWebhook(webhookUrl: string, instanceName: string): Promise<void> {
  await apiFetch(`/webhook/set/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({
      url:               webhookUrl,
      webhook_by_events: false,
      webhook_base64:    false,
      events: [
        'MESSAGES_UPSERT',   // mensagem recebida ou enviada
        'MESSAGES_UPDATE',   // status de entrega (lido, entregue)
        'CONNECTION_UPDATE', // mudança de estado da conexão
        'SEND_MESSAGE',      // confirmação de envio
      ],
    }),
  });
}

/** Verifica qual webhook está configurado atualmente */
export async function getWebhook(instanceName: string): Promise<{ url: string; events: string[] }> {
  return apiFetch(`/webhook/find/${instanceName}`);
}

// --------------- Parsing de Webhooks ----------------

/**
 * Parseia o body cru recebido no endpoint de webhook.
 * Use no seu backend (Express/Next/Supabase Edge).
 *
 * Exemplo (Express):
 *   app.post('/api/webhook/whatsapp', (req, res) => {
 *     const event = parseWebhookEvent(req.body);
 *     if (event?.type === 'message') { ... }
 *   });
 */
export function parseWebhookEvent(body: unknown):
  | { type: 'message'; from: string; text: string; timestamp: number; messageId: string }
  | { type: 'status';  messageId: string; status: string }
  | { type: 'connection'; state: InstanceState }
  | null
{
  const b = body as Record<string, unknown>;

  if (b.event === 'messages.upsert') {
    const d = (b.data as WebhookMessageEvent['data']);
    if (d.key.fromMe) return null; // ignora msgs enviadas por nós

    const text =
      d.message?.conversation ??
      d.message?.extendedTextMessage?.text ??
      '';

    return {
      type:      'message',
      from:      phoneFromJid(d.key.remoteJid),
      text:      text.trim(),
      timestamp: d.messageTimestamp * 1000,
      messageId: d.key.id,
    };
  }

  if (b.event === 'messages.update') {
    const d = (b.data as WebhookStatusEvent['data']);
    return {
      type:      'status',
      messageId: d.key.id,
      status:    d.update.status,
    };
  }

  if (b.event === 'connection.update') {
    const d = (b.data as WebhookConnectionEvent['data']);
    return { type: 'connection', state: d.state };
  }

  return null;
}

// --------------- Utils ------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Detecta se uma mensagem recebida tem intenção positiva (interesse) */
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
