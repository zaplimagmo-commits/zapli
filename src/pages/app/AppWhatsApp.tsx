// ============================================================
// AppWhatsApp — Painel de gerenciamento do Agente Zapli
//
// NOVO MODELO:
//   O WhatsApp não roda mais em servidor externo.
//   O cliente abre um link em qualquer dispositivo.
//   Esse link É o agente — cuida da conexão localmente.
//
//   Gestor:   vê status do agente + link para compartilhar
//   Vendedor/SDR: vê status da conexão (read-only)
// ============================================================

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/UIComponents';
import { Button } from '@/components/ui/button';
import {
  Smartphone, Link, Copy, CheckCircle2, WifiOff,
  ExternalLink, Shield, Lock, RefreshCw, Zap,
  QrCode, Info, Users, MessageCircle, Bell,
  Moon, Clock, Signal, Send,
} from 'lucide-react';
import { useAuth } from '@/hooks/AppContext';
import { useRole } from '@/hooks/useRole';
import { QRCodeSVG } from '@/components/QRCode';
import { agentManager, type AgentStatus, type AgentInfo, generateAgentLink } from '@/lib/agentManager';

// ── Tela read-only (Vendedor / SDR) ──────────────────────
function WhatsAppReadOnly({ agentInfo }: { agentInfo: AgentInfo | null }) {
  const isConnected = agentInfo?.status === 'connected';
  return (
    <AppLayout>
      <div className="px-6 py-7 max-w-2xl mx-auto">
        <PageHeader
          title="WhatsApp da Empresa"
          subtitle="Conexão gerenciada pela gestora"
        />
        <div className="rounded-2xl border overflow-hidden"
          style={{ borderColor: '#e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div className="px-6 py-4 flex items-center gap-3"
            style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <Lock size={15} className="text-indigo-500 shrink-0" />
            <p className="text-sm text-indigo-800">
              <strong>Acesso somente leitura.</strong> Apenas a gestora pode conectar ou alterar o WhatsApp da empresa.
            </p>
          </div>
          <div className="p-6 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: isConnected ? '#d1fae5' : '#f1f5f9' }}>
              {isConnected
                ? <CheckCircle2 size={28} className="text-emerald-600" />
                : <WifiOff size={28} className="text-slate-400" />}
            </div>
            <div className="text-center">
              <p className="font-bold text-slate-800 text-lg">
                {isConnected ? 'WhatsApp Conectado ✓' : 'WhatsApp Desconectado'}
              </p>
              {isConnected && agentInfo?.profilePhone && (
                <p className="text-slate-500 text-sm mt-1">+{agentInfo.profilePhone}</p>
              )}
              {!isConnected && (
                <p className="text-slate-500 text-sm mt-1">
                  Aguardando a gestora ativar o agente.
                </p>
              )}
            </div>
            {isConnected && (
              <div className="grid grid-cols-2 gap-3 w-full mt-2">
                {[
                  { label: 'Dispositivo', value: agentInfo?.deviceName ?? '—' },
                  { label: 'Enviadas hoje', value: agentInfo?.sentToday?.toString() ?? '0' },
                ].map(item => (
                  <div key={item.label} className="rounded-xl p-3 text-center border border-slate-100 bg-slate-50">
                    <p className="text-sm font-bold text-slate-700">{item.value}</p>
                    <p className="text-xs text-slate-500">{item.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

// ── Tela principal (Gestor) ──────────────────────────────
export default function AppWhatsApp() {
  const { user } = useAuth();
  const { isGestor } = useRole();
  const tenantId = user?.tenantId ?? 'demo';

  const [agentInfo,  setAgentInfo]  = useState<AgentInfo | null>(() => agentManager.getAgent(tenantId));
  const [copied,     setCopied]     = useState(false);
  const [showQR,     setShowQR]     = useState(false);

  const agentLink = generateAgentLink(tenantId);

  // Ouve mudanças do agente em tempo real
  useEffect(() => {
    setAgentInfo(agentManager.getAgent(tenantId));
    return agentManager.on(tenantId, (info) => setAgentInfo({ ...info }));
  }, [tenantId]);

  const status: AgentStatus = agentInfo?.status ?? 'offline';
  const isConnected  = status === 'connected';
  const isOnline     = status === 'online' || status === 'connecting';
  const isOffline    = status === 'offline';
  const isSleeping   = status === 'sleeping';

  // Read-only para não-gestores
  if (!isGestor) return <WhatsAppReadOnly agentInfo={agentInfo} />;

  async function copyLink() {
    await navigator.clipboard.writeText(agentLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function openAgent() {
    window.open(agentLink, '_blank');
  }

  // QR do link gerado dinamicamente com qrcode.react
  // (renderizado inline no JSX — sem btoa/SVG inline)

  return (
    <AppLayout>
      <div className="px-6 py-7 max-w-4xl mx-auto space-y-6">
        <PageHeader
          title="Agente WhatsApp"
          subtitle="Conecte o WhatsApp da empresa via link — sem servidor externo"
        />

        {/* ── Banner conceito ── */}
        <div className="rounded-xl p-4 flex items-start gap-3"
          style={{ background: '#eef2ff', border: '1px solid #c7d2fe' }}>
          <Zap size={16} className="text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-indigo-800">Como funciona o Zapli Agent</p>
            <p className="text-xs text-indigo-700 mt-0.5 leading-relaxed">
              Abra o link abaixo no celular ou computador da empresa. Esse dispositivo vira o agente de envio —
              o WhatsApp fica no seu aparelho, com seu IP, sem passar por servidor externo.
              O dashboard fica acessível de qualquer lugar normalmente.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Card: Link do Agente ── */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <Link size={15} className="text-indigo-500" />
              <h2 className="font-bold text-slate-800">Link do Agente</h2>
              <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: '#eef2ff', color: '#6366f1' }}>
                Exclusivo Gestor
              </span>
            </div>

            <div className="p-5 space-y-4">
              {/* URL box */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center gap-2">
                <code className="text-xs text-slate-600 flex-1 truncate font-mono">
                  {agentLink}
                </code>
                <button
                  onClick={copyLink}
                  className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: copied ? '#d1fae5' : '#eef2ff',
                    color:      copied ? '#065f46' : '#4f46e5',
                  }}>
                  {copied ? <><CheckCircle2 size={12} /> Copiado!</> : <><Copy size={12} /> Copiar</>}
                </button>
              </div>

              {/* Botão abrir agente */}
              <Button
                onClick={openAgent}
                className="w-full gap-2 font-semibold"
                style={{ background: '#1e1b4b', borderColor: '#1e1b4b' }}>
                <ExternalLink size={15} />
                Abrir Agente neste dispositivo
              </Button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400">ou escaneie com o celular</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* QR do link */}
              <div className="text-center">
                <button
                  onClick={() => setShowQR(s => !s)}
                  className="flex items-center gap-2 mx-auto text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
                  <QrCode size={14} />
                  {showQR ? 'Ocultar QR Code' : 'Mostrar QR Code do link'}
                </button>

                {showQR && (
                  <div className="mt-4 inline-block p-3 rounded-xl border border-slate-200 bg-white">
                    <QRCodeSVG
                      value={agentLink}
                      size={176}
                      bgColor="#ffffff"
                      fgColor="#1e1b4b"
                    />
                    <p className="text-xs text-slate-400 mt-2">
                      Aponte a câmera do celular para abrir o agente
                    </p>
                  </div>
                )}
              </div>

              {/* Info de compartilhamento */}
              <div className="rounded-lg p-3 flex items-start gap-2"
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Info size={13} className="text-slate-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-500">
                  Este link é único da sua empresa. Compartilhe apenas com dispositivos confiáveis da empresa.
                  O link pode ser aberto em celular, tablet ou computador.
                </p>
              </div>
            </div>
          </div>

          {/* ── Card: Status do Agente ── */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <Signal size={15} className="text-emerald-500" />
              <h2 className="font-bold text-slate-800">Status do Agente</h2>
            </div>

            <div className="p-5 space-y-4">
              {/* Status principal */}
              <div className={[
                'rounded-xl p-4 flex items-center gap-4',
                isConnected ? 'bg-emerald-50 border border-emerald-200' :
                isOnline    ? 'bg-amber-50 border border-amber-200' :
                isSleeping  ? 'bg-slate-50 border border-slate-200' :
                              'bg-slate-50 border border-slate-200',
              ].join(' ')}>
                <div className={[
                  'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                  isConnected ? 'bg-emerald-100' :
                  isOnline    ? 'bg-amber-100'   :
                  isSleeping  ? 'bg-slate-100'   : 'bg-slate-100',
                ].join(' ')}>
                  {isConnected  && <CheckCircle2 size={22} className="text-emerald-600" />}
                  {isOnline     && <RefreshCw    size={22} className="text-amber-600 animate-spin" />}
                  {isSleeping   && <Moon         size={22} className="text-slate-500" />}
                  {isOffline    && <WifiOff      size={22} className="text-slate-400" />}
                </div>
                <div>
                  <p className={[
                    'font-bold',
                    isConnected ? 'text-emerald-800' :
                    isOnline    ? 'text-amber-800'   :
                    'text-slate-600',
                  ].join(' ')}>
                    {isConnected ? 'Agente conectado ✓' :
                     isOnline    ? 'Agente online — aguardando QR' :
                     isSleeping  ? 'Agente em repouso' :
                     'Agente offline'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isConnected  && agentInfo?.profilePhone  ? `+${agentInfo.profilePhone}` :
                     isConnected                              ? agentInfo?.profileName ?? '' :
                     isOnline                                 ? 'Abra o agente e escaneie o QR' :
                     isSleeping                               ? 'Dispositivo com tela bloqueada' :
                     'Abra o link do agente em qualquer dispositivo'}
                  </p>
                </div>
              </div>

              {/* Métricas */}
              {isConnected && agentInfo && (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: <Send   size={13} />, label: 'Enviadas hoje',  value: agentInfo.sentToday.toString(),     color: 'text-indigo-600' },
                    { icon: <Signal size={13} />, label: 'Dispositivo',    value: agentInfo.deviceName,               color: 'text-emerald-600' },
                    { icon: <Clock  size={13} />, label: 'Conectado',      value: agentInfo.connectedAt ? new Date(agentInfo.connectedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—', color: 'text-slate-600' },
                    { icon: <Zap    size={13} />, label: 'Versão',         value: agentInfo.agentVersion,             color: 'text-slate-600' },
                  ].map(m => (
                    <div key={m.label} className="rounded-lg p-3 border border-slate-100 bg-slate-50">
                      <div className={`flex items-center gap-1.5 mb-1 ${m.color}`}>{m.icon}<span className="text-xs font-medium">{m.label}</span></div>
                      <p className="text-sm font-bold text-slate-800">{m.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Offline: call to action */}
              {isOffline && (
                <div className="text-center py-4 space-y-3">
                  <p className="text-sm text-slate-500">
                    Nenhum agente ativo. Abra o link em qualquer dispositivo para começar.
                  </p>
                  <Button onClick={openAgent} variant="outline" className="gap-2">
                    <ExternalLink size={14} />
                    Abrir Agente
                  </Button>
                </div>
              )}

              {/* Online mas sem QR ainda */}
              {isOnline && (
                <div className="flex items-start gap-3 rounded-lg p-3"
                  style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                  <RefreshCw size={14} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    O agente está aberto. Escaneie o QR Code que aparece na tela do dispositivo para conectar o WhatsApp.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Como funciona ── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-bold text-slate-800 mb-5 flex items-center gap-2">
            <Info size={15} className="text-indigo-500" />
            Fluxo completo do Zapli Agent
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { icon: '🔗', title: 'Abre o link',          desc: 'Gestor abre o link do agente no celular ou computador da empresa' },
              { icon: '📱', title: 'Conecta WhatsApp',     desc: 'Escaneia QR Code — WhatsApp vinculado como dispositivo extra' },
              { icon: '🤖', title: 'Bot opera 24/7',       desc: 'Agente recebe campanhas do cloud e envia com IP real da empresa' },
              { icon: '📊', title: 'Dashboard em qualquer lugar', desc: 'Gestor e equipe acessam o CRM e relatórios de qualquer device' },
            ].map((item, i) => (
              <div key={i} className="relative">
                {i < 3 && (
                  <div className="hidden md:block absolute right-0 top-5 translate-x-1/2 text-slate-300 text-lg z-10">→</div>
                )}
                <div className="rounded-xl p-4 h-full" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <p className="text-sm font-semibold text-slate-700 mb-1">{item.title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Compatibilidade de dispositivos ── */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2 text-sm">
            <Smartphone size={14} className="text-slate-500" />
            Compatibilidade do Agente
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: '🤖', name: 'Android',    status: '✅ Recomendado', note: 'App nativo em breve', ok: true },
              { icon: '💻', name: 'Windows/Mac', status: '✅ Funciona',   note: 'Deixe o browser aberto', ok: true },
              { icon: '📱', name: 'iPhone/iPad', status: '⚠️ Limitado',  note: 'Funciona mas sem background', ok: false },
              { icon: '🍓', name: 'Raspberry Pi',status: '✅ Ideal 24/7', note: 'Dispositivo dedicado', ok: true },
            ].map(d => (
              <div key={d.name} className={[
                'rounded-xl p-3 border',
                d.ok ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50',
              ].join(' ')}>
                <div className="text-xl mb-1.5">{d.icon}</div>
                <p className="text-sm font-semibold text-slate-700">{d.name}</p>
                <p className={`text-xs font-medium ${d.ok ? 'text-emerald-700' : 'text-amber-700'}`}>{d.status}</p>
                <p className="text-xs text-slate-500 mt-0.5">{d.note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Acesso da equipe (lembrete) ── */}
        <div className="rounded-xl p-4 flex items-start gap-3"
          style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <Users size={15} className="text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              Equipe acessa normalmente pelo dashboard
            </p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Vendedores e SDRs usam <strong>app.zapli.com.br</strong> normalmente em qualquer browser.
              O link do agente é exclusivo do gestor para configuração do WhatsApp.
            </p>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
