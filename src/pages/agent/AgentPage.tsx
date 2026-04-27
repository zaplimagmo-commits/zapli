import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Wifi, WifiOff, Loader2, RefreshCw, CheckCircle2, Phone, Zap } from 'lucide-react';

// ── Tipos ────────────────────────────────────────────────────────────────────
type AgentStatus = 'offline' | 'connecting' | 'qr_ready' | 'connected';

interface WSMessage {
  type: 'status' | 'qr' | 'connected' | 'message_received' | 'error';
  status?: AgentStatus;
  qr?: string;          // base64 PNG
  qrRaw?: string;
  profileName?: string;
  profilePhone?: string;
  hasQR?: boolean;
  message?: string;
  reason?: number;
}

// ── Configuração do servidor ──────────────────────────────────────────────────
const SERVER_URL = import.meta.env.VITE_AGENT_SERVER_URL as string | undefined;

function getWsUrl(tenantId: string): string | null {
  if (!SERVER_URL) return null;
  const base = SERVER_URL.replace(/^http/, 'ws').replace(/\/$/, '');
  return `${base}/ws?tenantId=${tenantId}`;
}

function getApiUrl(path: string): string | null {
  if (!SERVER_URL) return null;
  return `${SERVER_URL.replace(/\/$/, '')}${path}`;
}

// ────────────────────────────────────────────────────────────────────────────
export default function AgentPage() {
  const { tenantId } = useParams<{ tenantId: string }>();

  const [status, setStatus] = useState<AgentStatus>('offline');
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [profilePhone, setProfilePhone] = useState<string | null>(null);
  const [serverOnline, setServerOnline] = useState(false);
  const [serverChecked, setServerChecked] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addLog = useCallback((msg: string) => {
    const time = new Date().toLocaleTimeString('pt-BR');
    setLog(prev => [`[${time}] ${msg}`, ...prev].slice(0, 20));
  }, []);

  // ── Verificar se servidor está online ─────────────────────────────────────
  useEffect(() => {
    if (!SERVER_URL) {
      setServerChecked(true);
      return;
    }
    const url = getApiUrl('/');
    if (!url) { setServerChecked(true); return; }

    fetch(url, { method: 'GET' })
      .then(r => {
        setServerOnline(r.ok);
        setServerChecked(true);
      })
      .catch(() => {
        setServerOnline(false);
        setServerChecked(true);
      });
  }, []);

  // ── Conectar WebSocket ─────────────────────────────────────────────────────
  const connectWS = useCallback(() => {
    if (!tenantId || !SERVER_URL) return;
    const wsUrl = getWsUrl(tenantId);
    if (!wsUrl) return;

    // Fecha conexão anterior
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    addLog('Conectando ao servidor Zapli...');
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      addLog('✅ Servidor conectado');
      setServerOnline(true);
    };

    ws.onmessage = event => {
      try {
        const data = JSON.parse(event.data) as WSMessage;

        if (data.type === 'status') {
          setStatus(data.status ?? 'offline');
          if (data.profileName) setProfileName(data.profileName);
          if (data.profilePhone) setProfilePhone(data.profilePhone);
          addLog(`Status: ${data.status}`);
        }

        if (data.type === 'qr' && data.qr) {
          setQrImage(data.qr);
          setStatus('qr_ready');
          addLog('📱 QR code gerado — escaneie agora!');
        }

        if (data.type === 'connected') {
          setStatus('connected');
          setQrImage(null);
          if (data.profileName) setProfileName(data.profileName);
          if (data.profilePhone) setProfilePhone(data.profilePhone);
          addLog(`✅ WhatsApp conectado! ${data.profilePhone ?? ''}`);
        }

        if (data.type === 'error') {
          addLog(`❌ Erro: ${data.message}`);
        }
      } catch { /* ignora */ }
    };

    ws.onclose = () => {
      addLog('Conexão com servidor encerrada. Reconectando em 5s...');
      setServerOnline(false);
      reconnectTimer.current = setTimeout(() => connectWS(), 5000);
    };

    ws.onerror = () => {
      addLog('❌ Erro de conexão com servidor');
    };
  }, [tenantId, addLog]);

  useEffect(() => {
    if (serverChecked && serverOnline) {
      connectWS();
    }
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [serverChecked, serverOnline, connectWS]);

  // ── Ações ──────────────────────────────────────────────────────────────────
  function handleConnect() {
    if (!SERVER_URL) return;
    const url = getApiUrl(`/connect/${tenantId}`);
    if (!url) return;
    addLog('Iniciando conexão WhatsApp...');
    setStatus('connecting');
    fetch(url, { method: 'POST' }).catch(err => addLog(`Erro: ${err.message}`));
  }

  function handleDisconnect() {
    if (!SERVER_URL) return;
    const url = getApiUrl(`/disconnect/${tenantId}`);
    if (!url) return;
    fetch(url, { method: 'POST' }).then(() => {
      setStatus('offline');
      setQrImage(null);
      setProfileName(null);
      setProfilePhone(null);
      addLog('WhatsApp desconectado.');
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  const tid = tenantId ?? '—';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #0f172a 100%)' }}>

      {/* Cabeçalho */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#10b981' }}>
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-white font-bold text-xl">Zapli Agent</h1>
          <p className="text-indigo-300 text-xs font-mono">{tid}</p>
        </div>
      </div>

      {/* Card principal */}
      <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl">

        {/* Status bar */}
        <div className={`px-5 py-3 flex items-center gap-2 ${
          status === 'connected' ? 'bg-emerald-500' :
          status === 'qr_ready' ? 'bg-amber-500' :
          status === 'connecting' ? 'bg-blue-500' :
          'bg-slate-500'
        }`}>
          {status === 'connected' && <CheckCircle2 size={16} className="text-white" />}
          {status === 'qr_ready' && <Phone size={16} className="text-white" />}
          {status === 'connecting' && <Loader2 size={16} className="text-white animate-spin" />}
          {status === 'offline' && <WifiOff size={16} className="text-white" />}
          <span className="text-white text-sm font-semibold">
            {status === 'connected' ? `Conectado${profilePhone ? ` · ${profilePhone}` : ''}` :
             status === 'qr_ready' ? 'Escaneie o QR code' :
             status === 'connecting' ? 'Aguardando QR...' :
             'Desconectado'}
          </span>
        </div>

        <div className="p-6">
          {/* Servidor offline */}
          {serverChecked && !SERVER_URL && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                <WifiOff size={28} className="text-orange-500" />
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Servidor não configurado</h3>
              <p className="text-sm text-gray-500 mb-4">
                Configure <code className="bg-gray-100 px-1 rounded text-xs">VITE_AGENT_SERVER_URL</code> no <code className="bg-gray-100 px-1 rounded text-xs">.env</code> para conectar o WhatsApp.
              </p>
              <div className="rounded-lg p-3 text-left text-xs text-gray-600" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <p className="font-semibold mb-1">📋 Como configurar:</p>
                <p>1. Deploy do servidor em <strong>railway.app</strong></p>
                <p>2. Copie a URL do Railway</p>
                <p>3. Adicione em <code>.env</code>:</p>
                <code className="block mt-1 text-indigo-700">VITE_AGENT_SERVER_URL=https://xxx.railway.app</code>
              </div>
            </div>
          )}

          {/* Servidor configurado mas offline */}
          {serverChecked && SERVER_URL && !serverOnline && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <WifiOff size={28} className="text-red-500" />
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Servidor offline</h3>
              <p className="text-sm text-gray-500 mb-4">
                Não foi possível conectar ao servidor WhatsApp.<br />
                Verifique se o deploy no Railway está ativo.
              </p>
              <button
                onClick={connectWS}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ background: '#6366f1' }}
              >
                <RefreshCw size={14} /> Tentar novamente
              </button>
            </div>
          )}

          {/* QR Code — real, escaneável */}
          {serverOnline && status === 'qr_ready' && qrImage && (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4 font-medium">
                Abra o WhatsApp no celular → Dispositivos conectados → Conectar um dispositivo
              </p>
              <div className="inline-block p-3 rounded-xl bg-white border-2 border-emerald-400 shadow-lg">
                <img src={qrImage} alt="QR WhatsApp" width={240} height={240} className="block" />
              </div>
              <p className="text-xs text-gray-400 mt-3">QR expira em ~60s · Atualiza automaticamente</p>
            </div>
          )}

          {/* Aguardando QR */}
          {serverOnline && status === 'connecting' && !qrImage && (
            <div className="text-center py-8">
              <Loader2 size={40} className="text-indigo-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Gerando QR code...</p>
              <p className="text-sm text-gray-400 mt-1">Aguarde alguns segundos</p>
            </div>
          )}

          {/* Conectado */}
          {serverOnline && status === 'connected' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-emerald-500" />
              </div>
              <h3 className="font-bold text-gray-800 text-lg mb-1">WhatsApp Ativo!</h3>
              {profileName && <p className="text-gray-600 font-medium">{profileName}</p>}
              {profilePhone && <p className="text-sm text-gray-400">{profilePhone}</p>}
              <p className="text-xs text-emerald-600 mt-3 font-medium">
                ✅ Pronto para enviar e receber mensagens
              </p>
              <button
                onClick={handleDisconnect}
                className="mt-4 text-xs text-red-400 hover:text-red-600 underline"
              >
                Desconectar este dispositivo
              </button>
            </div>
          )}

          {/* Offline — botão para conectar */}
          {serverOnline && status === 'offline' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Wifi size={28} className="text-slate-400" />
              </div>
              <h3 className="font-bold text-gray-800 mb-2">WhatsApp desconectado</h3>
              <p className="text-sm text-gray-500 mb-5">
                Clique abaixo para gerar o QR code e conectar este número.
              </p>
              <button
                onClick={handleConnect}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
              >
                Conectar WhatsApp
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Log de eventos */}
      {log.length > 0 && (
        <div className="w-full max-w-sm mt-4">
          <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div className="px-4 py-2 border-b border-white/10">
              <span className="text-xs text-indigo-300 font-semibold">Log de eventos</span>
            </div>
            <div className="p-3 space-y-1 max-h-36 overflow-y-auto">
              {log.map((line, i) => (
                <p key={i} className="text-xs text-indigo-200 font-mono">{line}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      <p className="text-indigo-400 text-xs mt-6">Zapli MVP · WhatsApp via Baileys</p>
    </div>
  );
}
