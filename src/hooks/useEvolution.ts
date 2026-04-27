// ============================================================
// Hook useEvolution — gerencia conexão WhatsApp por tenant
// Integrado com HibernationManager para economia de RAM no VPS
//
// FLUXO DE HIBERNAÇÃO:
//   Qualquer ação → markActivity() → reinicia timer de 2h
//   2h sem uso    → hibernationManager.hibernate() → desconecta
//   Próximo login → wakeUp() automático antes de conectar
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  IS_CONFIGURED,
  buildInstanceName,
  getInstanceStatus,
  getQRCode,
  disconnectInstance,
  createInstance,
  isPositiveResponse,
  type InstanceState,
  type InstanceStatus,
} from '@/lib/evolutionApi';
import {
  hibernationManager,
  type HibernationState,
  type HibernationLock,
} from '@/lib/hibernationManager';
import { QueueProcessor, type QueueEvent } from '@/lib/queueProcessor';
import { defaultSendSettings, generateMockQueue } from '@/data/sendData';
import type { QueueItem, SendSettings } from '@/lib/index';

export type WaConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface UseEvolutionReturn {
  connectionStatus:   WaConnectionStatus;
  instanceState:      InstanceState | null;
  instanceName:       string;
  profileName:        string;
  profilePhone:       string;
  qrCodeBase64:       string;
  qrExpiresAt:        Date | null;
  apiConfigured:      boolean;

  // ← Hibernação
  hibernationState:    HibernationState;
  hibernationLocks:    HibernationLock[];
  minutesUntilSleep:   number | null;
  minutesSleeping:     number | null;
  totalSleeps:         number;
  savedRamMb:          number;

  connect:             () => Promise<void>;
  refreshQR:           () => Promise<void>;
  disconnect:          () => Promise<void>;
  manualHibernate:     () => void;
  manualWakeUp:        () => void;
  markActivity:        () => void;
  blockHibernation:    (reason: import('@/lib/hibernationManager').HibernationLockReason, ttlMs?: number) => void;
  unblockHibernation:  (reason: import('@/lib/hibernationManager').HibernationLockReason) => void;

  queue:              QueueItem[];
  queueRunning:       boolean;
  queuePaused:        boolean;
  sentToday:          number;
  queueEvents:        QueueEvent[];
  settings:           SendSettings;

  startQueue:         () => Promise<void>;
  pauseQueue:         () => void;
  resumeQueue:        () => void;
  stopQueue:          () => void;
  loadQueue:          (items: QueueItem[]) => void;
  updateSettings:     (s: SendSettings) => void;

  lastError:          string;
}

export function useEvolution(tenantId?: string): UseEvolutionReturn {
  const instanceName = buildInstanceName(tenantId ?? 'demo');

  const [connectionStatus, setConnectionStatus] = useState<WaConnectionStatus>('disconnected');
  const [instanceState,    setInstanceState]    = useState<InstanceState | null>(null);
  const [profileName,      setProfileName]      = useState('');
  const [profilePhone,     setProfilePhone]     = useState('');
  const [qrCodeBase64,     setQrCodeBase64]     = useState('');
  const [qrExpiresAt,      setQrExpiresAt]      = useState<Date | null>(null);
  const [lastError,        setLastError]        = useState('');

  // Hibernação
  const [hibernationState,  setHibernationState]  = useState<HibernationState>(
    () => hibernationManager.getState(instanceName)
  );
  const [hibernationLocks,  setHibernationLocks]  = useState<HibernationLock[]>(
    () => hibernationManager.getLocks(instanceName)
  );
  const [minutesUntilSleep, setMinutesUntilSleep] = useState<number | null>(null);
  const [minutesSleeping,   setMinesSleeping]     = useState<number | null>(null);
  const [totalSleeps,       setTotalSleeps]       = useState(0);
  const [savedRamMb,        setSavedRamMb]        = useState(0);

  // Fila
  const [queue,        setQueue]        = useState<QueueItem[]>([]);
  const [queueRunning, setQueueRunning] = useState(false);
  const [queuePaused,  setQueuePaused]  = useState(false);
  const [sentToday,    setSentToday]    = useState(0);
  const [queueEvents,  setQueueEvents]  = useState<QueueEvent[]>([]);
  const [settings,     setSettingsState] = useState<SendSettings>(defaultSendSettings);

  const processorRef = useRef<QueueProcessor | null>(null);
  const pollingRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const qrTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fila ──────────────────────────────────────────────────
  useEffect(() => {
    processorRef.current = new QueueProcessor(defaultSendSettings, tenantId ?? 'demo');
    const p = processorRef.current;

    const onEvent = (event: QueueEvent) => {
      setQueueEvents(prev => [event, ...prev].slice(0, 50));

      // ── Locks de hibernação por estado da fila ──
      if (event.type === 'started') {
        setQueueRunning(true);
        setQueuePaused(false);
        // Fila iniciada → BLOQUEIA hibernação enquanto rodar
        hibernationManager.blockHibernation(instanceName, 'queue_running');
        hibernationManager.markActivity(instanceName, tenantId);
      }
      if (event.type === 'resumed') {
        setQueuePaused(false);
        hibernationManager.blockHibernation(instanceName, 'queue_running');
      }
      if (event.type === 'paused') {
        setQueuePaused(true);
        // Pausada → mantém lock (ainda tem itens pendentes)
      }
      if (event.type === 'finished' || event.type === 'daily_limit_reached') {
        setQueueRunning(false);
        // Fila finalizada → REMOVE lock de fila
        hibernationManager.unblockHibernation(instanceName, 'queue_running');
        // Marca atividade para reiniciar timer normal
        hibernationManager.markActivity(instanceName, tenantId);
      }
      if (event.type === 'message_sent') {
        setSentToday(s => s + 1);
        setQueue(p.getQueue());
        hibernationManager.markActivity(instanceName, tenantId);
      }
      if (event.type === 'message_failed') {
        setQueue(p.getQueue());
      }
    };

    p.on(onEvent);

    if (!IS_CONFIGURED) {
      const demo = generateMockQueue(DEMO_CONTACTS, 'Parceria Empresarial');
      p.setQueue(demo);
      setQueue(demo);
    }

    return () => { p.off(onEvent); p.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Hibernação: listener de mudança de estado ─────────────
  useEffect(() => {
    const unsub = hibernationManager.on(instanceName, (state) => {
      setHibernationState(state);
      syncRecord();

      // Se hibernou, desconecta o WhatsApp no UI
      if (state === 'hibernated') {
        setConnectionStatus('disconnected');
        setInstanceState(null);
        setProfileName('');
        setProfilePhone('');
        stopPolling();
      }
    });

    // Sincroniza estado inicial
    setHibernationState(hibernationManager.getState(instanceName));
    syncRecord();

    // Timer para atualizar minutesUntilSleep e minutesSleeping a cada 30s
    statsTimerRef.current = setInterval(() => {
      setMinutesUntilSleep(hibernationManager.minutesUntilSleep(instanceName));
      setMinesSleeping(hibernationManager.minutesSleeping(instanceName));
    }, 30_000);

    return () => {
      unsub();
      if (statsTimerRef.current) clearInterval(statsTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceName]);

  // ── Ao trocar tenant ──────────────────────────────────────
  useEffect(() => {
    processorRef.current?.setTenant(tenantId ?? 'demo');
    if (!IS_CONFIGURED || !tenantId) return;
    checkExistingConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceName]);

  function syncRecord() {
    const r = hibernationManager.getRecord(instanceName);
    if (r) {
      setTotalSleeps(r.totalSleeps);
      setSavedRamMb(r.savedRamMb);
      setHibernationLocks([...r.locks]);
    }
    setMinutesUntilSleep(hibernationManager.minutesUntilSleep(instanceName));
    setMinesSleeping(hibernationManager.minutesSleeping(instanceName));
  }

  async function checkExistingConnection() {
    try {
      const status = await getInstanceStatus(instanceName);
      applyInstanceStatus(status);
    } catch {
      setConnectionStatus('disconnected');
    }
  }

  function startPolling() {
    pollingRef.current = setInterval(async () => {
      try {
        const status = await getInstanceStatus(instanceName);
        applyInstanceStatus(status);
        if (status.state === 'open') stopPolling();
      } catch { /* ignora */ }
    }, 3000);
  }

  function stopPolling() {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
  }

  function clearPolling() {
    stopPolling();
    if (qrTimerRef.current) { clearTimeout(qrTimerRef.current); qrTimerRef.current = null; }
  }

  function applyInstanceStatus(status: InstanceStatus) {
    setInstanceState(status.state);
    if (status.state === 'open') {
      setConnectionStatus('connected');
      setProfileName(status.profileName ?? '');
      setProfilePhone(status.phone ?? '');
      setQrCodeBase64('');
      stopPolling();
      // Marca como ativo ao detectar conexão estabelecida
      hibernationManager.markActivity(instanceName, tenantId);
    } else if (status.state === 'close' || status.state === 'refused') {
      setConnectionStatus('disconnected');
    }
  }

  // ── Ações públicas ────────────────────────────────────────

  /** Marca atividade — reseta o timer de hibernação */
  const markActivity = useCallback(() => {
    hibernationManager.markActivity(instanceName, tenantId);
    syncRecord();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceName, tenantId]);

  /** Hibernar manualmente */
  const manualHibernate = useCallback(() => {
    hibernationManager.hibernate(instanceName);
  }, [instanceName]);

  /** Acordar manualmente */
  const manualWakeUp = useCallback(() => {
    hibernationManager.wakeUp(instanceName);
  }, [instanceName]);

  /** Conectar — acorda instância se necessário, depois gera QR */
  const connect = useCallback(async () => {
    setLastError('');

    // Se estava hibernada → acorda primeiro
    if (hibernationManager.isHibernated(instanceName)) {
      hibernationManager.wakeUp(instanceName);
      // Aguarda o wake-up completar (2s demo / 30s produção)
      await sleep(IS_CONFIGURED ? 2000 : 2000);
    }

    if (!IS_CONFIGURED) {
      setConnectionStatus('connecting');
      await sleep(1500);
      setQrCodeBase64(DEMO_QR_BASE64);
      setQrExpiresAt(new Date(Date.now() + 60_000));
      hibernationManager.markActivity(instanceName, tenantId);
      return;
    }

    try {
      setConnectionStatus('connecting');

      let status: InstanceStatus;
      try {
        status = await getInstanceStatus(instanceName);
      } catch {
        await createInstance(instanceName);
        status = await getInstanceStatus(instanceName);
      }

      if (status.state === 'open') {
        applyInstanceStatus(status);
        return;
      }

      await fetchQR();
      startPolling();
      hibernationManager.markActivity(instanceName, tenantId);

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setLastError(msg);
      setConnectionStatus('error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceName, tenantId]);

  const refreshQR = useCallback(async () => {
    if (!IS_CONFIGURED) {
      setQrCodeBase64('');
      await sleep(800);
      setQrCodeBase64(DEMO_QR_BASE64);
      setQrExpiresAt(new Date(Date.now() + 60_000));
      return;
    }
    await fetchQR();
    hibernationManager.markActivity(instanceName, tenantId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceName]);

  async function fetchQR() {
    try {
      const data = await getQRCode(instanceName);
      const src  = data.code.startsWith('data:') ? data.code : `data:image/png;base64,${data.code}`;
      setQrCodeBase64(src);
      setQrExpiresAt(new Date(Date.now() + 60_000));
      if (qrTimerRef.current) clearTimeout(qrTimerRef.current);
      qrTimerRef.current = setTimeout(() => fetchQR(), 55_000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setLastError(`Erro ao buscar QR: ${msg}`);
    }
  }

  const disconnect = useCallback(async () => {
    clearPolling();
    if (IS_CONFIGURED) {
      try { await disconnectInstance(instanceName); } catch { /* ignora */ }
    }
    setConnectionStatus('disconnected');
    setInstanceState(null);
    setProfileName('');
    setProfilePhone('');
    setQrCodeBase64('');
    setQrExpiresAt(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceName]);

  const startQueue  = useCallback(async () => {
    const p = processorRef.current;
    if (!p) return;
    await p.start();
    setQueueRunning(true);
    hibernationManager.markActivity(instanceName, tenantId);
  }, [instanceName, tenantId]);

  const pauseQueue  = useCallback(() => { processorRef.current?.pause(); setQueuePaused(true); }, []);
  const resumeQueue = useCallback(() => {
    processorRef.current?.resume();
    setQueuePaused(false);
    hibernationManager.markActivity(instanceName, tenantId);
  }, [instanceName, tenantId]);
  const stopQueue   = useCallback(() => { processorRef.current?.stop(); setQueueRunning(false); setQueuePaused(false); }, []);
  const loadQueue   = useCallback((items: QueueItem[]) => {
    const p = processorRef.current;
    if (!p) return;
    p.setQueue(items);
    setQueue([...items]);
  }, []);
  const updateSettings = useCallback((s: SendSettings) => {
    processorRef.current?.updateSettings(s);
    setSettingsState(s);
  }, []);

  // Expõe blockHibernation/unblockHibernation para uso externo (ex: AppCampaigns)
  const blockHibernation = useCallback((
    reason: import('@/lib/hibernationManager').HibernationLockReason,
    ttlMs?: number
  ) => {
    hibernationManager.blockHibernation(instanceName, reason, ttlMs);
    setHibernationLocks(hibernationManager.getLocks(instanceName));
  }, [instanceName]);

  const unblockHibernation = useCallback((
    reason: import('@/lib/hibernationManager').HibernationLockReason
  ) => {
    hibernationManager.unblockHibernation(instanceName, reason);
    setHibernationLocks(hibernationManager.getLocks(instanceName));
  }, [instanceName]);

  return {
    connectionStatus, instanceState, instanceName,
    profileName, profilePhone, qrCodeBase64, qrExpiresAt,
    apiConfigured: IS_CONFIGURED,

    hibernationState,
    hibernationLocks,
    minutesUntilSleep,
    minutesSleeping,
    totalSleeps,
    savedRamMb,

    connect, refreshQR, disconnect,
    manualHibernate, manualWakeUp, markActivity,
    blockHibernation, unblockHibernation,

    queue, queueRunning, queuePaused, sentToday, queueEvents, settings,
    startQueue, pauseQueue, resumeQueue, stopQueue, loadQueue, updateSettings,

    lastError,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

const DEMO_CONTACTS = [
  { id: 'c1', name: 'Carlos Silva',   phone: '11999990001', company: 'Arquitetos & Associados' },
  { id: 'c2', name: 'Ana Ferreira',   phone: '11999990002', company: 'Studio Ferreira' },
  { id: 'c3', name: 'Bruno Costa',    phone: '11999990003', company: 'Costa Arquitetura' },
  { id: 'c4', name: 'Juliana Melo',   phone: '11999990004', company: 'Melo Projetos' },
  { id: 'c5', name: 'Pedro Alves',    phone: '11999990005', company: 'Alves & Partners' },
  { id: 'c6', name: 'Fernanda Lima',  phone: '11999990006', company: 'Lima Design' },
  { id: 'c7', name: 'Ricardo Souza',  phone: '11999990007', company: 'Souza Engenharia' },
  { id: 'c8', name: 'Patrícia Nunes', phone: '11999990008', company: 'Nunes Arquitetura' },
];

const DEMO_QR_BASE64 = 'data:image/svg+xml;base64,' + btoa(`
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="white"/>
  <text x="100" y="85" text-anchor="middle" font-size="12" fill="#374151" font-family="sans-serif">QR Code</text>
  <text x="100" y="103" text-anchor="middle" font-size="10" fill="#6b7280" font-family="sans-serif">(Demo)</text>
  <text x="100" y="120" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="sans-serif">Configure a Evolution API</text>
  <rect x="20" y="20" width="40" height="40" fill="none" stroke="#1e1b4b" stroke-width="4"/>
  <rect x="28" y="28" width="24" height="24" fill="#1e1b4b"/>
  <rect x="140" y="20" width="40" height="40" fill="none" stroke="#1e1b4b" stroke-width="4"/>
  <rect x="148" y="28" width="24" height="24" fill="#1e1b4b"/>
  <rect x="20" y="140" width="40" height="40" fill="none" stroke="#1e1b4b" stroke-width="4"/>
  <rect x="28" y="148" width="24" height="24" fill="#1e1b4b"/>
</svg>`);

export { isPositiveResponse, IS_CONFIGURED };
