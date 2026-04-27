// ============================================================
// HibernationManager v2 — Hibernação Inteligente
//
// REGRA CENTRAL:
//   Só hiberna se NÃO houver nenhum lock ativo.
//   Locks são adquiridos por: fila rodando, campanha ativa,
//   mensagem recente (<24h), follow-up pendente.
//
// FLUXO CORRETO:
//   Bot 7/24 ativo      → lock 'queue_running' ou 'campaign_active'
//                       → hibernação BLOQUEADA → instância sempre viva
//
//   Empresa sem uso     → nenhum lock
//                       → hiberna após 2h → economiza RAM
//
//   Follow-up às 10h    → lock 'followup_pending' colocado às 9h55
//                       → instância acorda, envia, remove lock
//
// PERSISTÊNCIA:
//   Estado salvo em localStorage.
//   Em produção: substituir por Redis para multi-server.
// ============================================================

export type HibernationState =
  | 'active'        // Rodando normalmente
  | 'idle'          // Ativa, sem atividade recente (aviso antes de hibernar)
  | 'locked'        // Bloqueada — não pode hibernar (bot rodando, mensagem recente, etc.)
  | 'hibernating'   // Desconectando...
  | 'hibernated'    // Dormindo
  | 'waking';       // Reconectando...

// Razões que bloqueiam a hibernação
export type HibernationLockReason =
  | 'queue_running'       // Fila de disparos em execução
  | 'campaign_active'     // Campanha de prospecção ativa
  | 'recent_message'      // Mensagem recebida nas últimas 24h
  | 'followup_pending'    // Follow-up agendado para as próximas horas
  | 'bot_responding'      // Bot respondendo ativamente a leads
  | 'manual';             // Bloqueio manual pelo gestor

export const LOCK_LABELS: Record<HibernationLockReason, string> = {
  queue_running:    '📤 Fila de envio em execução',
  campaign_active:  '📣 Campanha ativa',
  recent_message:   '💬 Mensagem recebida recentemente',
  followup_pending: '⏰ Follow-up agendado',
  bot_responding:   '🤖 Bot respondendo leads',
  manual:           '🔒 Bloqueio manual',
};

export interface HibernationLock {
  reason:    HibernationLockReason;
  acquiredAt: number;
  expiresAt?: number;  // null = permanente até ser removido explicitamente
  label:     string;
}

export interface InstanceRecord {
  instanceName:  string;
  tenantId:      string;
  state:         HibernationState;
  lastActivity:  number;
  locks:         HibernationLock[];
  hibernatedAt?: number;
  wokeAt?:       number;
  totalSleeps:   number;
  savedRamMb:    number;
}

interface StorageData {
  instances: Record<string, InstanceRecord>;
  version:   number;
}

const STORAGE_KEY      = 'zapli_hibernation_v2';
const STORAGE_VERSION  = 2;
const RAM_PER_INSTANCE = 256; // MB

export const HIBERNATION_TIMEOUTS = {
  starter:    30  * 60 * 1000,   // 30 min
  pro:         2  * 60 * 60 * 1000,  // 2h
  enterprise:  8  * 60 * 60 * 1000,  // 8h
  demo:        2  * 60 * 1000,   // 2 min (dev/teste)
} as const;

export type PlanTier = keyof typeof HIBERNATION_TIMEOUTS;

// ─── Singleton ───────────────────────────────────────────────

class HibernationManager {
  private data:      StorageData;
  private listeners: Map<string, Set<(state: HibernationState) => void>> = new Map();
  private timers:    Map<string, ReturnType<typeof setTimeout>>           = new Map();

  constructor() {
    this.data = this.loadFromStorage();
    this.auditOnStartup();
  }

  // ── Leitura ──────────────────────────────────────────────

  getRecord(instanceName: string): InstanceRecord | null {
    return this.data.instances[instanceName] ?? null;
  }

  getState(instanceName: string): HibernationState {
    return this.data.instances[instanceName]?.state ?? 'hibernated';
  }

  getLocks(instanceName: string): HibernationLock[] {
    return this.data.instances[instanceName]?.locks ?? [];
  }

  isHibernated(instanceName: string): boolean {
    const s = this.getState(instanceName);
    return s === 'hibernated' || s === 'hibernating';
  }

  isActive(instanceName: string): boolean {
    const s = this.getState(instanceName);
    return s === 'active' || s === 'idle' || s === 'locked';
  }

  /**
   * REGRA CENTRAL: só pode hibernar se não houver locks ativos.
   * Verifica e remove locks expirados antes de decidir.
   */
  canHibernate(instanceName: string): boolean {
    const record = this.data.instances[instanceName];
    if (!record) return true;

    // Remove locks expirados
    const now = Date.now();
    const before = record.locks.length;
    record.locks = record.locks.filter(l => !l.expiresAt || l.expiresAt > now);
    if (record.locks.length !== before) this.saveToStorage();

    return record.locks.length === 0;
  }

  minutesUntilSleep(instanceName: string, plan: PlanTier = 'pro'): number | null {
    const record = this.data.instances[instanceName];
    if (!record || !['active', 'idle'].includes(record.state)) return null;
    const timeout   = HIBERNATION_TIMEOUTS[plan];
    const elapsed   = Date.now() - record.lastActivity;
    const remaining = timeout - elapsed;
    return remaining > 0 ? Math.ceil(remaining / 60_000) : 0;
  }

  minutesSleeping(instanceName: string): number | null {
    const record = this.data.instances[instanceName];
    if (!record?.hibernatedAt) return null;
    return Math.floor((Date.now() - record.hibernatedAt) / 60_000);
  }

  getAllRecords(): InstanceRecord[] {
    return Object.values(this.data.instances);
  }

  globalStats() {
    const records     = this.getAllRecords();
    const activeCount = records.filter(r => ['active','idle','locked'].includes(r.state)).length;
    const sleepCount  = records.filter(r => r.state === 'hibernated').length;
    const lockedCount = records.filter(r => r.state === 'locked').length;
    const totalSaved  = records.reduce((sum, r) => sum + r.savedRamMb, 0);
    return { activeCount, sleepCount, lockedCount, totalSaved, totalInstances: records.length };
  }

  // ── Locks ─────────────────────────────────────────────────

  /**
   * Adquire um lock — impede hibernação enquanto ativo.
   * @param ttlMs  Tempo de vida do lock em ms (null = permanente até removelock)
   */
  blockHibernation(
    instanceName: string,
    reason: HibernationLockReason,
    ttlMs?: number,
  ): void {
    this.ensureRecord(instanceName);
    const record = this.data.instances[instanceName];

    // Remove lock anterior da mesma razão (evita duplicatas)
    record.locks = record.locks.filter(l => l.reason !== reason);

    const lock: HibernationLock = {
      reason,
      acquiredAt: Date.now(),
      expiresAt:  ttlMs ? Date.now() + ttlMs : undefined,
      label:      LOCK_LABELS[reason],
    };

    record.locks.push(lock);

    // Se estava no ciclo de hibernação → cancela e volta para 'locked'
    if (record.state === 'idle' || record.state === 'active') {
      record.state = 'locked';
      this.clearTimer(instanceName);
    }

    this.saveToStorage();
    this.emit(instanceName, record.state);
  }

  /**
   * Remove um lock específico.
   * Se não restar nenhum lock, reinicia o timer normal de hibernação.
   */
  unblockHibernation(instanceName: string, reason: HibernationLockReason): void {
    const record = this.data.instances[instanceName];
    if (!record) return;

    record.locks = record.locks.filter(l => l.reason !== reason);

    if (record.locks.length === 0 && record.state === 'locked') {
      // Sem mais locks → volta ao ciclo normal
      record.state = 'active';
      record.lastActivity = Date.now();
      this.saveToStorage();
      this.emit(instanceName, 'active');
      this.scheduleHibernation(instanceName);
    } else {
      this.saveToStorage();
    }
  }

  /** Remove TODOS os locks (usar com cautela) */
  clearAllLocks(instanceName: string): void {
    const record = this.data.instances[instanceName];
    if (!record) return;
    record.locks = [];
    if (record.state === 'locked') {
      record.state = 'active';
      record.lastActivity = Date.now();
      this.scheduleHibernation(instanceName);
    }
    this.saveToStorage();
    this.emit(instanceName, record.state);
  }

  // ── Atividade ─────────────────────────────────────────────

  /** Marca atividade — reinicia o timer de hibernação (não afeta locks) */
  markActivity(instanceName: string, tenantId?: string): void {
    const now = Date.now();
    this.ensureRecord(instanceName, tenantId);
    const record = this.data.instances[instanceName];

    record.lastActivity = now;

    // Só agenda hibernação se não houver locks
    if (record.state === 'idle') {
      record.state = 'active';
    }

    if (record.state === 'active' && this.canHibernate(instanceName)) {
      this.scheduleHibernation(instanceName);
    }

    this.saveToStorage();
  }

  // ── Hibernação / Wake ─────────────────────────────────────

  hibernate(instanceName: string, force = false): void {
    const record = this.data.instances[instanceName];
    if (!record) return;
    if (record.state === 'hibernated' || record.state === 'hibernating') return;

    // Verifica locks (a menos que seja forçado)
    if (!force && !this.canHibernate(instanceName)) {
      // Tem lock ativo — não hiberna, mantém como 'locked'
      record.state = 'locked';
      this.saveToStorage();
      this.emit(instanceName, 'locked');
      return;
    }

    record.state        = 'hibernating';
    record.hibernatedAt = Date.now();
    this.clearTimer(instanceName);
    this.saveToStorage();
    this.emit(instanceName, 'hibernating');

    setTimeout(() => {
      const r = this.data.instances[instanceName];
      if (r && r.state === 'hibernating') {
        r.state      = 'hibernated';
        r.totalSleeps++;
        r.savedRamMb += RAM_PER_INSTANCE;
        this.saveToStorage();
        this.emit(instanceName, 'hibernated');
      }
    }, 1500);
  }

  wakeUp(instanceName: string): void {
    const record = this.data.instances[instanceName];
    if (!record) return;
    if (record.state === 'active' || record.state === 'waking' || record.state === 'locked') return;

    record.state  = 'waking';
    record.wokeAt = Date.now();
    this.saveToStorage();
    this.emit(instanceName, 'waking');

    setTimeout(() => {
      const r = this.data.instances[instanceName];
      if (r && r.state === 'waking') {
        r.state        = r.locks.length > 0 ? 'locked' : 'active';
        r.lastActivity = Date.now();
        this.saveToStorage();
        this.emit(instanceName, r.state);
        if (r.state === 'active') this.scheduleHibernation(instanceName);
      }
    }, 2000);
  }

  removeInstance(instanceName: string): void {
    delete this.data.instances[instanceName];
    this.clearTimer(instanceName);
    this.saveToStorage();
  }

  // ── Listeners ─────────────────────────────────────────────

  on(instanceName: string, cb: (state: HibernationState) => void): () => void {
    if (!this.listeners.has(instanceName)) {
      this.listeners.set(instanceName, new Set());
    }
    this.listeners.get(instanceName)!.add(cb);
    return () => this.listeners.get(instanceName)?.delete(cb);
  }

  // ── Internos ──────────────────────────────────────────────

  private emit(instanceName: string, state: HibernationState): void {
    this.listeners.get(instanceName)?.forEach(cb => cb(state));
  }

  private ensureRecord(instanceName: string, tenantId?: string): void {
    if (!this.data.instances[instanceName]) {
      this.data.instances[instanceName] = {
        instanceName,
        tenantId:    tenantId ?? instanceName,
        state:       'active',
        lastActivity: Date.now(),
        locks:       [],
        totalSleeps: 0,
        savedRamMb:  0,
      };
    }
  }

  private scheduleHibernation(instanceName: string, plan: PlanTier = 'pro'): void {
    this.clearTimer(instanceName);

    // Antes de agendar, verifica se há locks
    if (!this.canHibernate(instanceName)) return;

    const timeout = HIBERNATION_TIMEOUTS[plan];
    const idleAt  = timeout * 0.8;

    const idleTimer = setTimeout(() => {
      const record = this.data.instances[instanceName];
      if (record?.state === 'active' && this.canHibernate(instanceName)) {
        record.state = 'idle';
        this.saveToStorage();
        this.emit(instanceName, 'idle');
      }
    }, idleAt);

    const sleepTimer = setTimeout(() => {
      const record = this.data.instances[instanceName];
      if (record && (record.state === 'active' || record.state === 'idle')) {
        this.hibernate(instanceName);
      }
    }, timeout);

    this.timers.set(`${instanceName}_idle`,  idleTimer);
    this.timers.set(`${instanceName}_sleep`, sleepTimer);
  }

  private clearTimer(instanceName: string): void {
    ['idle', 'sleep'].forEach(suffix => {
      const key = `${instanceName}_${suffix}`;
      const t   = this.timers.get(key);
      if (t) clearTimeout(t);
      this.timers.delete(key);
    });
  }

  private auditOnStartup(): void {
    const now = Date.now();
    let changed = false;

    for (const record of Object.values(this.data.instances)) {
      // Limpa locks expirados
      const before = record.locks.length;
      record.locks = record.locks.filter(l => !l.expiresAt || l.expiresAt > now);
      if (record.locks.length !== before) changed = true;

      if (record.state === 'active' || record.state === 'idle') {
        if (record.locks.length > 0) {
          // Tem locks — fica como locked
          record.state = 'locked';
          changed = true;
        } else {
          const elapsed = now - record.lastActivity;
          const timeout = HIBERNATION_TIMEOUTS['pro'];
          if (elapsed > timeout) {
            record.state        = 'hibernated';
            record.hibernatedAt = record.lastActivity + timeout;
            record.totalSleeps++;
            record.savedRamMb  += RAM_PER_INSTANCE;
            changed = true;
          } else {
            this.scheduleHibernation(record.instanceName);
          }
        }
      }
    }

    if (changed) this.saveToStorage();
  }

  private loadFromStorage(): StorageData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return this.emptyData();
      const parsed: StorageData = JSON.parse(raw);
      if (parsed.version !== STORAGE_VERSION) return this.emptyData();
      // Garante que todos os records têm o campo locks
      for (const r of Object.values(parsed.instances)) {
        if (!r.locks) r.locks = [];
      }
      return parsed;
    } catch {
      return this.emptyData();
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch { /* quota exceeded */ }
  }

  private emptyData(): StorageData {
    return { instances: {}, version: STORAGE_VERSION };
  }
}

export const hibernationManager = new HibernationManager();
