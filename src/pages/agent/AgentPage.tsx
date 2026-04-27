// ============================================================
// AgentPage — Página do Agente Zapli (PWA)
//
// Esta página É o agente. O cliente abre o link no celular
// ou computador e ela cuida da conexão WhatsApp.
//
// URL: /#/agent/:tenantId
// Pode ser instalada como PWA (Add to Home Screen)
// ============================================================

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Wifi, WifiOff, Smartphone, CheckCircle2,
  Moon, Zap, RefreshCw, Battery, Signal,
  MessageSquare, Send, Clock, AlertCircle,
  ChevronDown, ChevronUp, Download,
} from 'lucide-react';
import { QRCodeSVG } from '@/components/QRCode';
import { agentManager, type AgentStatus } from '@/lib/agentManager';

// Conteúdo demo do QR (em produção: gerado pelo backend Evolution/Baileys)
const DEMO_QR_CONTENT = 'https://zapli.com.br/demo-whatsapp-qr';

// ── SVG removido — usando qrcode.react ────────────────────

// ── Dados de demo por tenant ───────────────────────────────
const TENANT_DEMO: Record<string, { name: string; company: string }> = {
  tenant1: { name: 'Ana Oliveira',  company: 'Construtora ABC' },
  tenant2: { name: 'Carlos Souza',  company: 'Fornecedor XYZ' },
  demo:    { name: 'Usuário Demo',  company: 'Empresa Demo' },
};

// ── Componente principal ───────────────────────────────────
export default function AgentPage() {
  const { tenantId = 'demo' } = useParams<{ tenantId: string }>();
  const tenant  = TENANT_DEMO[tenantId] ?? { name: 'Empresa', company: tenantId };

  const [status,       setStatus]       = useState<AgentStatus>('online');
  const [profileName,  setProfileName]  = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [qrVisible,    setQrVisible]    = useState(true);
  const [sentToday,    setSentToday]    = useState(0);
  const [uptime,       setUptime]       = useState(0);
  const [showStats,    setShowStats]    = useState(false);
  const [connecting,   setConnecting]   = useState(false);
  const [canInstall,   setCanInstall]   = useState(false);
  const [qrExpiry,     setQrExpiry]     = useState(60);

  const uptimeRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const qrTimerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deferredRef  = useRef<any>(null);

  // Registra agente ao abrir
  useEffect(() => {
    agentManager.registerAgent(tenantId);

    // PWA install prompt
    const onBeforeInstall = (e: Event) => { e.preventDefault(); deferredRef.current = e; setCanInstall(true); };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    // Uptime counter
    uptimeRef.current = setInterval(() => setUptime(s => s + 1), 1000);

    // QR expiry countdown
    qrTimerRef.current = setInterval(() => {
      setQrExpiry(s => {
        if (s <= 1) { refreshQR(); return 60; }
        return s - 1;
      });
    }, 1000);

    return () => {
      agentManager.setOffline(tenantId);
      if (uptimeRef.current)  clearInterval(uptimeRef.current);
      if (qrTimerRef.current) clearInterval(qrTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  // Listener de mudanças do agente
  useEffect(() => {
    return agentManager.on(tenantId, (info) => {
      setStatus(info.status);
      setProfileName(info.profileName);
      setProfilePhone(info.profilePhone);
      setSentToday(info.sentToday);
    });
  }, [tenantId]);

  // Simula conexão ao clicar "Já escaneei"
  async function handleConnect() {
    setConnecting(true);
    setStatus('connecting');
    agentManager.setStatus(tenantId, 'connecting');
    await new Promise(r => setTimeout(r, 2500));
    const phone = '5511' + Math.floor(900000000 + Math.random() * 99999999);
    agentManager.setConnected(tenantId, tenant.name, phone);
    setStatus('connected');
    setProfileName(tenant.name);
    setProfilePhone(phone);
    setQrVisible(false);
    setConnecting(false);
    if (qrTimerRef.current) clearInterval(qrTimerRef.current);
  }

  function refreshQR() {
    setQrExpiry(60);
    setQrVisible(false);
    setTimeout(() => setQrVisible(true), 400);
  }

  async function handleInstall() {
    if (!deferredRef.current) return;
    deferredRef.current.prompt();
    await deferredRef.current.userChoice;
    deferredRef.current = null;
    setCanInstall(false);
  }

  function formatUptime(s: number): string {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
  }

  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f8fafc' }}>

      {/* ── Topo ── */}
      <div className="px-4 pt-5 pb-3 flex items-center justify-between"
        style={{ background: '#1e1b4b' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: '#10b981' }}>
            <span className="text-white font-black text-sm">Z</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Zapli Agent</p>
            <p className="text-indigo-300 text-xs">{tenant.company}</p>
          </div>
        </div>

        {/* Status badge */}
        <div className={[
          'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
          isConnected
            ? 'bg-emerald-500/20 text-emerald-300'
            : isConnecting
              ? 'bg-amber-500/20 text-amber-300'
              : 'bg-slate-500/20 text-slate-300',
        ].join(' ')}>
          {isConnected ? (
            <><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Ativo</>
          ) : isConnecting ? (
            <><RefreshCw size={10} className="animate-spin" />Conectando</>
          ) : (
            <><span className="w-1.5 h-1.5 rounded-full bg-slate-400" />Aguardando</>
          )}
        </div>
      </div>

      {/* ── Instalar como App ── */}
      {canInstall && (
        <button onClick={handleInstall}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white"
          style={{ background: '#4f46e5' }}>
          <Download size={14} />
          Instalar como app no dispositivo
          <span className="ml-auto text-indigo-300 text-xs">Recomendado</span>
        </button>
      )}

      <div className="flex-1 px-4 py-5 space-y-4 max-w-sm mx-auto w-full">

        {/* ── CONECTADO ── */}
        {isConnected && (
          <>
            {/* Card principal */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: '#1e1b4b' }}>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                    style={{ background: '#10b981' }}>
                    😊
                  </div>
                  <div>
                    <p className="text-white font-bold">{profileName}</p>
                    <p className="text-indigo-300 text-sm">+{profilePhone}</p>
                  </div>
                  <CheckCircle2 size={20} className="ml-auto text-emerald-400" />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: <Send size={13} />,    label: 'Enviadas',  value: sentToday.toString() },
                    { icon: <Clock size={13} />,   label: 'Uptime',    value: formatUptime(uptime) },
                    { icon: <Signal size={13} />,  label: 'Sinal',     value: '100%' },
                  ].map(item => (
                    <div key={item.label}
                      className="rounded-xl p-2.5 text-center"
                      style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="flex justify-center mb-1 text-emerald-400">{item.icon}</div>
                      <p className="text-white font-bold text-sm">{item.value}</p>
                      <p className="text-indigo-300 text-xs">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status bar */}
              <div className="px-5 py-3 flex items-center gap-2"
                style={{ background: 'rgba(16,185,129,0.15)', borderTop: '1px solid rgba(16,185,129,0.2)' }}>
                <Zap size={13} className="text-emerald-400" />
                <p className="text-emerald-300 text-xs font-medium">
                  Agente ativo — enviando mensagens automaticamente
                </p>
              </div>
            </div>

            {/* Dica de manter ativo */}
            <div className="rounded-xl border p-4 flex items-start gap-3"
              style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
              <Battery size={16} style={{ color: '#d97706', flexShrink: 0, marginTop: 1 }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: '#92400e' }}>
                  Mantenha este dispositivo ativo
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#b45309' }}>
                  Deixe a tela ligada ou instale como app para funcionar em segundo plano.
                  No celular, desative a economia de bateria para este app.
                </p>
              </div>
            </div>

            {/* Stats expandíveis */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <button
                onClick={() => setShowStats(s => !s)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-700">
                <span className="flex items-center gap-2">
                  <MessageSquare size={14} className="text-indigo-500" />
                  Atividade do agente
                </span>
                {showStats ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {showStats && (
                <div className="px-4 pb-4 grid grid-cols-2 gap-3 border-t border-slate-100">
                  {[
                    { label: 'Enviadas hoje',   value: sentToday },
                    { label: 'Online há',        value: formatUptime(uptime) },
                    { label: 'Dispositivo',      value: navigator.userAgent.includes('Android') ? 'Android' : 'Desktop' },
                    { label: 'Versão agente',    value: '1.0.0' },
                  ].map(item => (
                    <div key={item.label} className="pt-3">
                      <p className="text-xs text-slate-500">{item.label}</p>
                      <p className="text-sm font-bold text-slate-800">{item.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Desconectar */}
            <button
              onClick={() => { agentManager.setStatus(tenantId, 'online'); setStatus('online'); setQrVisible(true); }}
              className="w-full py-3 rounded-xl text-sm font-medium text-red-600 border border-red-200"
              style={{ background: '#fff5f5' }}>
              Desconectar WhatsApp
            </button>
          </>
        )}

        {/* ── QR / CONECTANDO ── */}
        {!isConnected && (
          <>
            {/* Instruções */}
            <div className="rounded-2xl p-4" style={{ background: '#1e1b4b' }}>
              <p className="text-white font-bold mb-1">Conecte o WhatsApp</p>
              <p className="text-indigo-300 text-sm">
                Abra o WhatsApp no seu celular e escaneie o código abaixo para ativar o agente.
              </p>
            </div>

            {/* QR Code */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
              {isConnecting ? (
                <div className="py-8 space-y-3">
                  <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
                    style={{ background: '#d1fae5' }}>
                    <RefreshCw size={28} className="text-emerald-600 animate-spin" />
                  </div>
                  <p className="font-semibold text-slate-700">Conectando ao WhatsApp...</p>
                  <p className="text-sm text-slate-500">Aguarde alguns segundos</p>
                </div>
              ) : (
                <>
                  <div className="relative inline-block">
                    {qrVisible && (
                      <div className="p-3 bg-white rounded-xl border border-slate-200 inline-block">
                        <QRCodeSVG
                          value={DEMO_QR_CONTENT}
                          size={200}
                          bgColor="#ffffff"
                          fgColor="#111827"
                        />
                      </div>
                    )}
                    {/* Expiry overlay */}
                    {qrExpiry <= 15 && qrVisible && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-xl"
                        style={{ background: 'rgba(0,0,0,0.6)' }}>
                        <div className="text-center">
                          <p className="text-white font-bold text-2xl">{qrExpiry}s</p>
                          <p className="text-white/80 text-xs">Atualizando...</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Timer bar */}
                  <div className="mt-3 h-1 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width:      `${(qrExpiry / 60) * 100}%`,
                        background: qrExpiry > 20 ? '#10b981' : '#f59e0b',
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Código expira em {qrExpiry}s
                  </p>
                </>
              )}
            </div>

            {/* Passo a passo */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Como escanear
              </p>
              {[
                { step: '1', text: 'Abra o WhatsApp no celular' },
                { step: '2', text: 'Toque em ⋮ Mais opções → Dispositivos vinculados' },
                { step: '3', text: 'Toque em "Vincular um dispositivo"' },
                { step: '4', text: 'Aponte a câmera para o QR code acima' },
              ].map(item => (
                <div key={item.step} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 text-white"
                    style={{ background: '#1e1b4b' }}>
                    {item.step}
                  </span>
                  <p className="text-sm text-slate-600">{item.text}</p>
                </div>
              ))}
            </div>

            {/* Botão confirmar (demo) */}
            {!isConnecting && (
              <button
                onClick={handleConnect}
                className="w-full py-4 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2"
                style={{ background: '#25D366' }}>
                <Smartphone size={16} />
                Já escaneei o QR Code
              </button>
            )}

            {/* Atualizar QR */}
            {!isConnecting && (
              <button
                onClick={refreshQR}
                className="w-full py-3 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 flex items-center justify-center gap-2">
                <RefreshCw size={14} />
                Gerar novo QR Code
              </button>
            )}
          </>
        )}

        {/* ── Rodapé ── */}
        <div className="text-center pt-2 pb-6">
          <p className="text-xs text-slate-400">
            Zapli Agent v1.0 · {tenant.company}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Mantenha este link aberto para o bot funcionar
          </p>
        </div>
      </div>
    </div>
  );
}
