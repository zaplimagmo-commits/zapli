// ============================================================
// Motor de fila de envio com regras anti-bloqueio
// Usado pelo hook useEvolution e pela página AppQueue
// ============================================================

import type { QueueItem, SendSettings } from '@/lib/index';
import { sendText, buildInstanceName, IS_CONFIGURED } from '@/lib/evolutionApi';

// --------------- Tipos ------------------------------

export type QueueEventType =
  | 'started'
  | 'message_sent'
  | 'message_failed'
  | 'paused'
  | 'resumed'
  | 'finished'
  | 'daily_limit_reached'
  | 'out_of_hours';

export interface QueueEvent {
  type:      QueueEventType;
  itemId?:   string;
  phone?:    string;
  name?:     string;
  error?:    string;
  progress?: { sent: number; failed: number; total: number };
}

export type QueueListener = (event: QueueEvent) => void;

// --------------- QueueProcessor ---------------------

export class QueueProcessor {
  private queue:        QueueItem[] = [];
  private settings:     SendSettings;
  private instanceName: string;
  private running       = false;
  private paused        = false;
  private listeners:    QueueListener[] = [];
  private sentToday     = 0;
  private lastDayReset = new Date().toDateString();

  constructor(settings: SendSettings, tenantId = 'demo') {
    this.settings     = settings;
    this.instanceName = buildInstanceName(tenantId);
  }

  /** Atualiza o tenant/instância dinamicamente */
  setTenant(tenantId: string) {
    this.instanceName = buildInstanceName(tenantId);
  }

  // ---- Configuração ----

  updateSettings(s: SendSettings) {
    this.settings = s;
  }

  setQueue(items: QueueItem[]) {
    this.queue = [...items];
  }

  addToQueue(items: QueueItem[]) {
    this.queue.push(...items);
  }

  getQueue(): QueueItem[] {
    return [...this.queue];
  }

  isRunning()  { return this.running; }
  isPaused()   { return this.paused; }

  // ---- Eventos ----

  on(listener: QueueListener)  { this.listeners.push(listener); }
  off(listener: QueueListener) { this.listeners = this.listeners.filter(l => l !== listener); }

  private emit(event: QueueEvent) {
    this.listeners.forEach(l => l(event));
  }

  // ---- Controles ----

  pause()  { this.paused = true;  this.emit({ type: 'paused' }); }
  resume() { this.paused = false; this.emit({ type: 'resumed' }); this.processNext(); }

  stop() {
    this.running = false;
    this.paused  = false;
  }

  // ---- Verificações anti-bloqueio ----

  private resetDailyCounterIfNeeded() {
    const today = new Date().toDateString();
    if (today !== this.lastDayReset) {
      this.sentToday    = 0;
      this.lastDayReset = today;
    }
  }

  private isWithinSendingHours(): boolean {
    const now   = new Date();
    const hour  = now.getHours();
    const dow   = now.getDay() === 0 ? 7 : now.getDay(); // 1=Seg ... 7=Dom
    const { sendingHoursStart, sendingHoursEnd, daysOfWeek } = this.settings;
    return daysOfWeek.includes(dow) && hour >= sendingHoursStart && hour < sendingHoursEnd;
  }

  private hasReachedDailyLimit(): boolean {
    this.resetDailyCounterIfNeeded();
    const limit = this.settings.warmUpMode
      ? this.getWarmUpLimit()
      : this.settings.messagesPerDay;
    return this.sentToday >= limit;
  }

  /**
   * Modo aquecimento: começa com 10/dia, incrementa 10/dia até o limite normal.
   * Baseado nos dias desde o "início" (usa localStorage para persistir entre sessões).
   */
  private getWarmUpLimit(): number {
    const key       = 'zapli_warmup_start';
    const storedRaw = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    const start     = storedRaw ? new Date(storedRaw) : new Date();
    if (!storedRaw && typeof localStorage !== 'undefined') {
      localStorage.setItem(key, start.toISOString());
    }
    const days    = Math.floor((Date.now() - start.getTime()) / 86_400_000);
    const rampUp  = Math.min(10 + days * 10, this.settings.messagesPerDay);
    return rampUp;
  }

  private randomDelay(): number {
    const { minDelaySeconds, maxDelaySeconds } = this.settings;
    return (Math.floor(Math.random() * (maxDelaySeconds - minDelaySeconds + 1)) + minDelaySeconds) * 1000;
  }

  // ---- Processamento ----

  async start() {
    if (this.running) return;
    this.running = true;
    this.paused  = false;
    this.emit({ type: 'started' });
    await this.processNext();
  }

  private async processNext() {
    if (!this.running || this.paused) return;

    // Verifica horário
    if (!this.isWithinSendingHours()) {
      this.emit({ type: 'out_of_hours' });
      // Agenda próxima verificação para o início do próximo horário permitido
      const msUntilOpen = this.msUntilNextOpenWindow();
      setTimeout(() => { if (this.running && !this.paused) this.processNext(); }, msUntilOpen);
      return;
    }

    // Verifica limite diário
    if (this.hasReachedDailyLimit()) {
      this.emit({ type: 'daily_limit_reached', progress: this.progress() });
      this.running = false;
      return;
    }

    // Próximo item pendente
    const item = this.queue.find(i => i.status === 'pending');
    if (!item) {
      this.emit({ type: 'finished', progress: this.progress() });
      this.running = false;
      return;
    }

    // Marca como enviando
    this.updateItem(item.id, { status: 'sending' });

    try {
      if (IS_CONFIGURED) {
        // ✅ Envio real via Evolution API
        await sendText({
          phone:    item.contactPhone,
          text:     item.message,
          delayMs:  1200,
        }, this.instanceName);
      } else {
        // 🔵 Modo demo: simula latência
        await sleep(800 + Math.random() * 400);
      }

      const now = new Date();
      this.updateItem(item.id, { status: 'sent', sentAt: now });
      this.sentToday++;
      this.emit({
        type:     'message_sent',
        itemId:   item.id,
        phone:    item.contactPhone,
        name:     item.contactName,
        progress: this.progress(),
      });

    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      this.updateItem(item.id, { status: 'failed', error });
      this.emit({ type: 'message_failed', itemId: item.id, phone: item.contactPhone, error, progress: this.progress() });
    }

    // Delay anti-bloqueio antes do próximo
    const delay = this.randomDelay();
    setTimeout(() => {
      if (this.running && !this.paused) this.processNext();
    }, delay);
  }

  // ---- Helpers ----

  private updateItem(id: string, patch: Partial<QueueItem>) {
    this.queue = this.queue.map(i => i.id === id ? { ...i, ...patch } : i);
  }

  private progress() {
    return {
      sent:   this.queue.filter(i => i.status === 'sent').length,
      failed: this.queue.filter(i => i.status === 'failed').length,
      total:  this.queue.length,
    };
  }

  private msUntilNextOpenWindow(): number {
    const now  = new Date();
    const h    = now.getHours();
    const { sendingHoursStart } = this.settings;
    // Se for antes do horário de início hoje
    if (h < sendingHoursStart) {
      return (sendingHoursStart - h) * 3_600_000;
    }
    // Senão aguarda até amanhã
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(sendingHoursStart, 0, 0, 0);
    return tomorrow.getTime() - now.getTime();
  }

  /** Estimativa de tempo total para processar N itens pendentes */
  estimateMinutes(pendingCount?: number): number {
    const count = pendingCount ?? this.queue.filter(i => i.status === 'pending').length;
    const avg   = (this.settings.minDelaySeconds + this.settings.maxDelaySeconds) / 2;
    return Math.ceil((count * avg) / 60);
  }
}

// --------------- Singleton --------------------------
// Uma única instância compartilhada por toda a app

let _processor: QueueProcessor | null = null;

const _fallbackSettings: SendSettings = {
  messagesPerDay: 80,
  messagesPerHour: 15,
  minDelaySeconds: 45,
  maxDelaySeconds: 120,
  sendingHoursStart: 8,
  sendingHoursEnd: 20,
  daysOfWeek: [1, 2, 3, 4, 5],
  warmUpMode: false,
};

export function getQueueProcessor(settings?: SendSettings): QueueProcessor {
  if (!_processor) {
    _processor = new QueueProcessor(settings ?? _fallbackSettings);
  } else if (settings) {
    _processor.updateSettings(settings);
  }
  return _processor;
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}
