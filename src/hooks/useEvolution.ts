import { useState, useEffect, useRef, useCallback } from 'react';
import {
  IS_CONFIGURED,
  buildInstanceName,
  getInstanceStatus,
  getQRCode,
  disconnectInstance,
  createInstance,
  type InstanceState,
  type InstanceStatus,
} from '@/lib/evolutionApi';
import {
  hibernationManager,
  type HibernationState,
  type HibernationLock,
} from '@/lib/hibernationManager';
import { QueueProcessor, type QueueEvent } from '@/lib/queueProcessor';
import { defaultSendSettings } from '@/data/sendData';
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
  blockHibernation:    (reason: any, ttlMs?: number) => void;
  unblockHibernation:  (reason: any) => void;

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
  const instanceName = buildInstanceName(tenantId || 'default');

  const [connectionStatus, setConnectionStatus] = useState<WaConnectionStatus>('disconnected');
  const [instanceState,    setInstanceState]    = useState<InstanceState | null>(null);
  const [profileName,      setProfileName]      = useState('');
  const [profilePhone,     setProfilePhone]     = useState('');
  const [qrCodeBase64,     setQrCodeBase64]     = useState('');
  const [qrExpiresAt,      setQrExpiresAt]      = useState<Date | null>(null);
  const [lastError,        setLastError]        = useState('');

  const [hibernationState,  setHibernationState]  = useState<HibernationState>(() => hibernationManager.getState(instanceName));
  const [hibernationLocks,  setHibernationLocks]  = useState<HibernationLock[]>(() => hibernationManager.getLocks(instanceName));
  const [minutesUntilSleep, setMinutesUntilSleep] = useState<number | null>(null);
  const [minutesSleeping,   setMinesSleeping]     = useState<number | null>(null);
  const [totalSleeps,       setTotalSleeps]       = useState(0);
  const [savedRamMb,        setSavedRamMb]        = useState(0);

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

  useEffect(() => {
    processorRef.current = new QueueProcessor(defaultSendSettings, tenantId || 'default');
    const p = processorRef.current;

    const onEvent = (event: QueueEvent) => {
      setQueueEvents(prev => [event, ...prev].slice(0, 50));
      if (event.type === 'started') {
        setQueueRunning(true);
        setQueuePaused(false);
        hibernationManager.blockHibernation(instanceName, 'queue_running');
        hibernationManager.markActivity(instanceName, tenantId);
      }
      if (event.type === 'resumed') {
        setQueuePaused(false);
        hibernationManager.blockHibernation(instanceName, 'queue_running');
      }
      if (event.type === 'paused') setQueuePaused(true);
      if (event.type === 'finished' || event.type === 'daily_limit_reached') {
        setQueueRunning(false);
        hibernationManager.unblockHibernation(instanceName, 'queue_running');
        hibernationManager.markActivity(instanceName, tenantId);
      }
      if (event.type === 'message_sent') {
        setSentToday(s => s + 1);
        setQueue(p.getQueue());
        hibernationManager.markActivity(instanceName, tenantId);
      }
      if (event.type === 'message_failed') setQueue(p.getQueue());
    };

    p.on(onEvent);
    return () => { p.off(onEvent); p.stop(); };
  }, [instanceName, tenantId]);

  useEffect(() => {
    const unsub = hibernationManager.on(instanceName, (state) => {
      setHibernationState(state);
      syncRecord();
      if (state === 'hibernated') {
        setConnectionStatus('disconnected');
        setInstanceState(null);
        setProfileName('');
        setProfilePhone('');
        stopPolling();
      }
    });
    setHibernationState(hibernationManager.getState(instanceName));
    syncRecord();
    statsTimerRef.current = setInterval(() => {
      setMinutesUntilSleep(hibernationManager.minutesUntilSleep(instanceName));
      setMinesSleeping(hibernationManager.minutesSleeping(instanceName));
    }, 30_000);
    return () => {
      unsub();
      if (statsTimerRef.current) clearInterval(statsTimerRef.current);
    };
  }, [instanceName]);

  useEffect(() => {
    processorRef.current?.setTenant(tenantId || 'default');
    if (!tenantId) return;
    checkExistingConnection();
  }, [instanceName, tenantId]);

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

  function applyInstanceStatus(status: InstanceStatus) {
    setInstanceState(status.state);
    if (status.state === 'open') {
      setConnectionStatus('connected');
      setProfileName(status.profileName ?? '');
      setProfilePhone(status.phone ?? '');
      setQrCodeBase64('');
      stopPolling();
      hibernationManager.markActivity(instanceName, tenantId);
    } else if (status.state === 'close' || status.state === 'refused') {
      setConnectionStatus('disconnected');
    }
  }

  const markActivity = useCallback(() => {
    hibernationManager.markActivity(instanceName, tenantId);
    syncRecord();
  }, [instanceName, tenantId]);

  const manualHibernate = useCallback(() => hibernationManager.hibernate(instanceName), [instanceName]);
  const manualWakeUp = useCallback(() => hibernationManager.wakeUp(instanceName), [instanceName]);

  const connect = useCallback(async () => {
    setLastError('');
    if (hibernationManager.isHibernated(instanceName)) {
      hibernationManager.wakeUp(instanceName);
      await new Promise(r => setTimeout(r, 2000));
    }
    if (!IS_CONFIGURED) {
      setLastError('Evolution API não configurada no ambiente.');
      setConnectionStatus('error');
      return;
    }
    try {
      setConnectionStatus('connecting');
      await createInstance(instanceName);
      const qr = await getQRCode(instanceName);
      if (qr.base64) {
        setQrCodeBase64(qr.base64);
        setQrExpiresAt(new Date(Date.now() + 40000));
        startPolling();
      }
    } catch (err: any) {
      setLastError(err.message || 'Erro ao conectar');
      setConnectionStatus('error');
    }
  }, [instanceName]);

  const refreshQR = useCallback(async () => {
    if (!IS_CONFIGURED) return;
    try {
      const qr = await getQRCode(instanceName);
      if (qr.base64) {
        setQrCodeBase64(qr.base64);
        setQrExpiresAt(new Date(Date.now() + 40000));
      }
    } catch (err: any) {
      setLastError(err.message || 'Erro ao atualizar QR');
    }
  }, [instanceName]);

  const disconnect = useCallback(async () => {
    if (!IS_CONFIGURED) return;
    try {
      await disconnectInstance(instanceName);
      setConnectionStatus('disconnected');
      setInstanceState(null);
      setProfileName('');
      setProfilePhone('');
      setQrCodeBase64('');
    } catch (err: any) {
      setLastError(err.message || 'Erro ao desconectar');
    }
  }, [instanceName]);

  const startQueue = useCallback(async () => {
    if (connectionStatus !== 'connected') {
      setLastError('Conecte o WhatsApp antes de iniciar a fila.');
      return;
    }
    processorRef.current?.start();
  }, [connectionStatus]);

  const pauseQueue = useCallback(() => processorRef.current?.pause(), []);
  const resumeQueue = useCallback(() => processorRef.current?.resume(), []);
  const stopQueue = useCallback(() => processorRef.current?.stop(), []);
  const loadQueue = useCallback((items: QueueItem[]) => {
    processorRef.current?.setQueue(items);
    setQueue(items);
  }, []);
  const updateSettings = useCallback((s: SendSettings) => {
    processorRef.current?.updateSettings(s);
    setSettingsState(s);
  }, []);

  return {
    connectionStatus, instanceState, instanceName, profileName, profilePhone,
    qrCodeBase64, qrExpiresAt, apiConfigured: IS_CONFIGURED,
    hibernationState, hibernationLocks, minutesUntilSleep, minutesSleeping, totalSleeps, savedRamMb,
    connect, refreshQR, disconnect, manualHibernate, manualWakeUp, markActivity,
    blockHibernation: (r, t) => hibernationManager.blockHibernation(instanceName, r, t),
    unblockHibernation: (r) => hibernationManager.unblockHibernation(instanceName, r),
    queue, queueRunning, queuePaused, sentToday, queueEvents, settings,
    startQueue, pauseQueue, resumeQueue, stopQueue, loadQueue, updateSettings,
    lastError
  };
}
