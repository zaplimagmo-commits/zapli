import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/UIComponents';
import { Button } from '@/components/ui/button';
import {
  Smartphone, Link, Copy, CheckCircle2, WifiOff,
  ExternalLink, Shield, Lock, Zap,
  QrCode, Info, MessageCircle, Loader2, Monitor
} from 'lucide-react';
import { useAuth } from '@/hooks/AppContext';
import { agentManager } from '@/lib/agentManager';
import { toast } from '@/hooks/use-toast';

export default function AppWhatsApp() {
  const { user } = useAuth();
  const [agentInfo, setAgentInfo] = useState(user?.tenantId ? agentManager.getAgent(user.tenantId) : null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user?.tenantId) return;

    // Subscrever para atualizações do agente
    const unsub = agentManager.on(user.tenantId, (info) => {
      setAgentInfo(info);
    });

    return () => unsub();
  }, [user?.tenantId]);

  const agentLink = user?.tenantId ? agentManager.getAgentLink(user.tenantId) : '';

  async function copyLink() {
    if (agentLink) {
      await navigator.clipboard.writeText(agentLink);
      setCopied(true);
      toast({
        title: "Link copiado!",
        description: "O link do agente foi copiado para sua área de transferência.",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const isConnected = agentInfo?.status === 'connected';

  return (
    <AppLayout>
      <div className="px-6 py-7 max-w-4xl mx-auto space-y-6">
        <PageHeader
          title="Conexão WhatsApp"
          subtitle="Conecte seu WhatsApp através do Agente Zapli para disparos automáticos"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card de Status */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-800">Status do Agente</h3>
              <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                isConnected ? 'bg-emerald-100 text-emerald-700' :
                agentInfo?.status === 'online' ? 'bg-blue-100 text-blue-700' :
                'bg-slate-100 text-slate-600'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-500' :
                  agentInfo?.status === 'online' ? 'bg-blue-500 animate-pulse' :
                  'bg-slate-400'
                }`} />
                {isConnected ? 'Conectado' :
                 agentInfo?.status === 'online' ? 'Agente Aberto' : 'Offline'}
              </div>
            </div>

            {isConnected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold">
                    {agentInfo?.profileName?.charAt(0) || 'W'}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{agentInfo?.profileName || 'WhatsApp Conectado'}</p>
                    <p className="text-sm text-slate-500">+{agentInfo?.profilePhone}</p>
                  </div>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                  <p className="text-xs text-emerald-700 flex items-center gap-2">
                    <CheckCircle2 size={14} /> Agente ativo no dispositivo: <strong>{agentInfo?.deviceName}</strong>
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Para iniciar a prospecção, você deve abrir o <strong>Link do Agente</strong> em um celular ou computador que ficará dedicado aos envios.
                </p>
                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 space-y-3">
                  <p className="text-xs font-semibold text-indigo-800 flex items-center gap-2">
                    <Info size={14} /> Como conectar:
                  </p>
                  <ul className="text-xs text-indigo-700 space-y-2 list-disc pl-4">
                    <li>Copie o link abaixo e abra no navegador do celular</li>
                    <li>No celular, clique em "Conectar WhatsApp"</li>
                    <li>Escaneie o QR Code que aparecerá</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Card de Link/QR */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col items-center justify-center">
            <div className="text-center space-y-4 w-full">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Link className="text-indigo-600" size={32} />
              </div>
              <h4 className="font-bold text-slate-800">Link do Agente</h4>
              <p className="text-xs text-slate-500 px-4">
                Este é o seu link exclusivo. Mantenha-o aberto em um dispositivo para que o sistema possa enviar mensagens.
              </p>
              
              <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg w-full">
                <code className="text-[10px] text-slate-600 truncate flex-1 text-left px-2">
                  {agentLink}
                </code>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={copyLink}>
                  {copied ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full">
                <Button 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9"
                  onClick={() => window.open(agentLink, '_blank')}
                >
                  <ExternalLink size={14} className="mr-2" /> Abrir Agente
                </Button>
                <Button 
                  variant="outline"
                  className="text-xs h-9"
                  onClick={copyLink}
                >
                  <Copy size={14} className="mr-2" /> Copiar Link
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Dicas de Segurança */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
          <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Shield size={18} className="text-indigo-600" /> Por que usar o Agente Zapli?
          </h4>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-100">
                <Smartphone size={16} className="text-indigo-600" />
              </div>
              <p className="text-xs font-bold text-slate-800">IP do seu Dispositivo</p>
              <p className="text-[11px] text-slate-600 leading-relaxed">As mensagens são enviadas diretamente do seu aparelho, reduzindo drasticamente as chances de bloqueio pelo WhatsApp.</p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-100">
                <Lock size={16} className="text-indigo-600" />
              </div>
              <p className="text-xs font-bold text-slate-800">Privacidade Total</p>
              <p className="text-[11px] text-slate-600 leading-relaxed">Sua sessão do WhatsApp fica salva apenas no seu navegador local, nunca em nossos servidores.</p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-100">
                <Zap size={16} className="text-indigo-600" />
              </div>
              <p className="text-xs font-bold text-slate-800">Conexão Estável</p>
              <p className="text-[11px] text-slate-600 leading-relaxed">Utiliza a tecnologia oficial do WhatsApp Web para garantir que as mensagens cheguem ao destino com rapidez.</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
