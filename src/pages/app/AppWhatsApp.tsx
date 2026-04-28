import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/UIComponents';
import { Button } from '@/components/ui/button';
import {
  Smartphone, Link, Copy, CheckCircle2, WifiOff,
  ExternalLink, Shield, Lock, RefreshCw, Zap,
  QrCode, Info, Users, MessageCircle, Bell,
  Moon, Clock, Signal, Send, Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/AppContext';
import { useRole } from '@/hooks/useRole';
import { useEvolution } from '@/hooks/useEvolution';

export default function AppWhatsApp() {
  const { user } = useAuth();
  const { isGestor } = useRole();
  const {
    connectionStatus, profileName, profilePhone, qrCodeBase64, qrExpiresAt,
    connect, disconnect, refreshQR, lastError, apiConfigured
  } = useEvolution(user?.tenantId);

  const [copied, setCopied] = useState(false);

  async function handleConnect() {
    await connect();
  }

  async function handleDisconnect() {
    await disconnect();
  }

  async function copyPhone() {
    if (profilePhone) {
      await navigator.clipboard.writeText(profilePhone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (!apiConfigured) {
    return (
      <AppLayout>
        <div className="px-6 py-7 max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="text-amber-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">API não configurada</h2>
          <p className="text-slate-600 mb-6">As variáveis de ambiente da Evolution API não foram encontradas. Entre em contato com o suporte.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-6 py-7 max-w-4xl mx-auto space-y-6">
        <PageHeader
          title="Conexão WhatsApp"
          subtitle="Gerencie a conexão oficial do seu WhatsApp para disparos automáticos"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card de Status */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-800">Status da Instância</h3>
              <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                connectionStatus === 'connected' ? 'bg-emerald-100 text-emerald-700' :
                connectionStatus === 'connecting' ? 'bg-amber-100 text-amber-700' :
                'bg-slate-100 text-slate-600'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-emerald-500' :
                  connectionStatus === 'connecting' ? 'bg-amber-500 animate-pulse' :
                  'bg-slate-400'
                }`} />
                {connectionStatus === 'connected' ? 'Conectado' :
                 connectionStatus === 'connecting' ? 'Conectando...' : 'Desconectado'}
              </div>
            </div>

            {connectionStatus === 'connected' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold">
                    {profileName?.charAt(0) || 'W'}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{profileName || 'WhatsApp Conectado'}</p>
                    <p className="text-sm text-slate-500">+{profilePhone}</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100" onClick={handleDisconnect}>
                  Desconectar Instância
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">Para iniciar a prospecção, você precisa conectar seu WhatsApp via QR Code.</p>
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleConnect} disabled={connectionStatus === 'connecting'}>
                  {connectionStatus === 'connecting' ? <Loader2 className="animate-spin mr-2" size={16} /> : <QrCode className="mr-2" size={16} />}
                  Gerar QR Code
                </Button>
              </div>
            )}

            {lastError && (
              <p className="mt-4 text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100">{lastError}</p>
            )}
          </div>

          {/* Card de QR Code */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
            {qrCodeBase64 ? (
              <div className="text-center space-y-4">
                <div className="p-4 bg-white border-2 border-slate-100 rounded-2xl shadow-inner">
                  <img src={qrCodeBase64} alt="WhatsApp QR Code" className="w-48 h-48" />
                </div>
                <p className="text-xs text-slate-500">Escaneie o código no seu WhatsApp em<br /><strong>Aparelhos Conectados</strong></p>
                <Button variant="ghost" size="sm" className="text-indigo-600" onClick={refreshQR}>
                  <RefreshCw size={14} className="mr-2" /> Atualizar QR Code
                </Button>
              </div>
            ) : connectionStatus === 'connected' ? (
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="text-emerald-600" size={32} />
                </div>
                <p className="text-sm font-medium text-slate-800">Tudo pronto!</p>
                <p className="text-xs text-slate-500">Seu WhatsApp está pronto para enviar mensagens.</p>
              </div>
            ) : (
              <div className="text-center space-y-3 opacity-40">
                <QrCode size={64} className="mx-auto text-slate-300" />
                <p className="text-sm text-slate-400">Aguardando solicitação de conexão</p>
              </div>
            )}
          </div>
        </div>

        {/* Dicas de Segurança */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
          <h4 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
            <Shield size={18} /> Dicas de Segurança e Anti-Bloqueio
          </h4>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-bold text-indigo-800">Warm-up Gradual</p>
              <p className="text-[11px] text-indigo-700">O Zapli aumenta o volume de envios aos poucos para não alertar o WhatsApp.</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-indigo-800">Intervalos Aleatórios</p>
              <p className="text-[11px] text-indigo-700">As mensagens não são enviadas em intervalos fixos, simulando o comportamento humano.</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-indigo-800">Horário Comercial</p>
              <p className="text-[11px] text-indigo-700">Por padrão, a fila só processa mensagens em horários de maior conversão.</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
