// ============================================================
// AgentManager — Gerenciador do Agente Zapli
//
// CONCEITO:
//   O WhatsApp não roda mais em servidor seu.
//   O cliente abre um LINK no celular ou computador dele.
//   Esse link É o agente — conecta o WhatsApp localmente.
//
// ARQUITETURA:
//   Dashboard (qualquer browser) ←WebSocket→ Agente (link/PWA)
//   O agente roda no dispositivo do cliente.
//   Zapli Cloud só gerencia CRM, campanhas, relatórios.
//
// FLUXO:
//   1. Gestor abre zapli.com.br/agent/tenant1 no celular
//   2. Escaneia QR → WhatsApp conectado no celular dele
//   3. Agente recebe fila do cloud via WebSocket
//   4. Envia mensagens com IP real do dispositivo
//   5. Dashboard mostra tudo em tempo real
// ============================================================

export type AgentStatus =
  | 'offline'      // Agente não está aberto em nenhum device
  | 'online'       // Agente aberto, aguardando QR
  | 'connecting'   // Escaneando QR / conectando
  | 'connected'    // WhatsApp conectado e pronto
  | 'sleeping';    // Conectado mas ocioso (tela bloqueada)

export interface AgentInfo {
  tenantId:      string;
  status:        AgentStatus;
  deviceType:    'mobile' | 'desktop' | 'unknown';
  deviceName:    string;       // ex: "Android de Ana", "Chrome no MacBook"
  profileName:   string;       // nome do WhatsApp conectado
  profilePhone:  string;       // número conectado
  connectedAt:   number | null;
  lastSeen:      number | null;
  agentVersion:  string;
  // Estatísticas
  sentToday:     number;
  sentTotal:     number;
  uptime:        number;       // segundos online
}

export interface AgentMessage {
  id:       string;
  phone:    string;
  text:     string;
  status:   'queued' | 'sending' | 'sent' | 'failed';
  sentAt?:  number;
}

const STORAGE_KEY = 'zapli_agent_v1';

// ---- Utilitários ----

function detectDevice(): { type: 'mobile' | 'desktop'; name: string } {
  const ua = navigator.userAgent;
  const isMobile = /Android|iPhone|iPad|Mobile/i.test(ua);
  if (isMobile) {
    const isAndroid = /Android/i.test(ua);
    const isIOS     = /iPhone|iPad/i.test(ua);
    return {
      type: 'mobile',
      name: isAndroid ? 'Android' : isIOS ? 'iPhone/iPad' : 'Mobile',
    };
  }
  const isMac     = /Mac/i.test(ua);
  const isWin     = /Windows/i.test(ua);
  const isLinux   = /Linux/i.test(ua);
  return {
    type: 'desktop',
    name: isMac ? 'Mac' : isWin ? 'Windows' : isLinux ? 'Linux' : 'Desktop',
  };
}

function generateAgentLink(tenantId: string, baseUrl?: string): string {
  const base = baseUrl ?? window.location.origin;
  // HashRouter: usa /#/agent/tenantId
  return `${base}/#/agent/${tenantId}`;
}

// ---- Classe principal ----

class AgentManager {
  private agents: Map<string, AgentInfo> = new Map();
  private listeners: Map<string, Set<(info: AgentInfo) => void>> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  // ── Leitura ──────────────────────────────────────────────

  getAgent(tenantId: string): AgentInfo | null {
    return this.agents.get(tenantId) ?? null;
  }

  getStatus(tenantId: string): AgentStatus {
    return this.agents.get(tenantId)?.status ?? 'offline';
  }

  isConnected(tenantId: string): boolean {
    return this.getStatus(tenantId) === 'connected';
  }

  getAgentLink(tenantId: string): string {
    return generateAgentLink(tenantId);
  }

  // ── Agente se registra ao abrir o link ───────────────────

  registerAgent(tenantId: string): AgentInfo {
    const device   = detectDevice();
    const existing = this.agents.get(tenantId);

    const info: AgentInfo = {
      tenantId,
      status:       existing?.status === 'connected' ? 'connected' : 'online',
      deviceType:   device.type,
      deviceName:   device.name,
      profileName:  existing?.profileName  ?? '',
      profilePhone: existing?.profilePhone ?? '',
      connectedAt:  existing?.connectedAt  ?? null,
      lastSeen:     Date.now(),
      agentVersion: '1.0.0',
      sentToday:    existing?.sentToday ?? 0,
      sentTotal:    existing?.sentTotal ?? 0,
      uptime:       0,
    };

    this.agents.set(tenantId, info);
    this.saveToStorage();
    this.emit(tenantId, info);
    return info;
  }

  // ── WhatsApp conectado via QR ─────────────────────────────

  setConnected(tenantId: string, profileName: string, profilePhone: string): void {
    const info = this.agents.get(tenantId);
    if (!info) return;

    info.status       = 'connected';
    info.profileName  = profileName;
    info.profilePhone = profilePhone;
    info.connectedAt  = Date.now();
    info.lastSeen     = Date.now();

    this.saveToStorage();
    this.emit(tenantId, { ...info });
  }

  // ── Atualiza status ───────────────────────────────────────

  setStatus(tenantId: string, status: AgentStatus): void {
    const info = this.agents.get(tenantId);
    if (!info) return;
    info.status   = status;
    info.lastSeen = Date.now();
    this.saveToStorage();
    this.emit(tenantId, { ...info });
  }

  setOffline(tenantId: string): void {
    const info = this.agents.get(tenantId);
    if (!info) return;
    info.status   = 'offline';
    info.lastSeen = Date.now();
    this.saveToStorage();
    this.emit(tenantId, { ...info });
  }

  incrementSent(tenantId: string): void {
    const info = this.agents.get(tenantId);
    if (!info) return;
    info.sentToday++;
    info.sentTotal++;
    info.lastSeen = Date.now();
    this.saveToStorage();
  }

  // ── Listeners ─────────────────────────────────────────────

  on(tenantId: string, cb: (info: AgentInfo) => void): () => void {
    if (!this.listeners.has(tenantId)) {
      this.listeners.set(tenantId, new Set());
    }
    this.listeners.get(tenantId)!.add(cb);
    return () => this.listeners.get(tenantId)?.delete(cb);
  }

  private emit(tenantId: string, info: AgentInfo): void {
    this.listeners.get(tenantId)?.forEach(cb => cb(info));
  }

  // ── Persistência ──────────────────────────────────────────

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data: Record<string, AgentInfo> = JSON.parse(raw);
      // Agentes offline ao recarregar (browser fechou)
      for (const [key, info] of Object.entries(data)) {
        if (info.status === 'online' || info.status === 'connecting') {
          info.status = 'offline';
        }
        this.agents.set(key, info);
      }
    } catch { /* ignora */ }
  }

  private saveToStorage(): void {
    try {
      const data: Record<string, AgentInfo> = {};
      this.agents.forEach((info, key) => { data[key] = info; });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch { /* quota */ }
  }
}

export const agentManager = new AgentManager();
export { generateAgentLink };
