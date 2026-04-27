import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/UIComponents';
import { Button } from '@/components/ui/button';
import { useRole } from '@/hooks/useRole';
import { Instagram, Wifi, WifiOff, RefreshCw, ExternalLink, Info, CheckCircle2, AlertTriangle, MessageCircle, Zap, Eye, Lock, ArrowRight, Users, Shield } from 'lucide-react';

type IGStatus = 'disconnected' | 'connecting' | 'connected';

interface IGAccount { username: string; displayName: string; followers: number; following: number; accountType: 'personal' | 'business' | 'creator'; }

const MOCK_ACCOUNT: IGAccount = { username: '@zapli.oficial', displayName: 'Zapli — Prospecção Inteligente', followers: 1240, following: 380, accountType: 'business' };

export default function AppInstagram() {
  const { isGestor } = useRole();
  const [status, setStatus] = useState<IGStatus>('disconnected');
  const [account, setAccount] = useState<IGAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthStep, setOauthStep] = useState(0);

  const isConfigured = import.meta.env.VITE_EVOLUTION_URL && import.meta.env.VITE_EVOLUTION_KEY;
  const isConnected = status === 'connected';

  // Vendedor/SDR veem apenas status read-only
  if (!isGestor) {
    return (
      <AppLayout>
        <div className="px-8 py-7 max-w-3xl mx-auto">
          <PageHeader title="Instagram da Empresa" subtitle="Canal centralizado gerenciado pela gestora" />
          <div className="bg-card rounded-2xl border border-border p-6 mb-6 flex items-center gap-4"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: isConnected ? '#fce7f3' : '#f3f4f6' }}>
              <Instagram size={24} style={{ color: isConnected ? '#E1306C' : '#6b7280' }} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-foreground">Instagram Construtora ABC</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2.5 h-2.5 rounded-full"
                  style={{ background: isConnected ? '#E1306C' : '#9ca3af' }} />
                <span className="text-sm font-medium"
                  style={{ color: isConnected ? '#E1306C' : '#9ca3af' }}>
                  {isConnected ? 'Conectado e operacional' : 'Aguardando configuração da gestora'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl border"
            style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
            <Lock size={15} style={{ color: '#6366f1', flexShrink: 0, marginTop: 2 }} />
            <div>
              <p className="text-sm font-semibold text-foreground">Configuração exclusiva do Gestor</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                A conexão OAuth e configurações do Instagram são gerenciadas pela gestora para manter o canal centralizado e seguro.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ background: '#eef2ff', color: '#6366f1' }}>
              <Shield size={11} /> GESTOR
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  async function handleConnect() {
    setLoading(true);
    setStatus('connecting');
    setOauthStep(1);
    await new Promise(r => setTimeout(r, 1200));
    setOauthStep(2);
    await new Promise(r => setTimeout(r, 1000));
    setOauthStep(3);
    await new Promise(r => setTimeout(r, 800));
    setAccount(MOCK_ACCOUNT);
    setStatus('connected');
    setLoading(false);
    setOauthStep(0);
  }

  function handleDisconnect() {
    setAccount(null);
    setStatus('disconnected');
    setOauthStep(0);
  }

  return (
    <AppLayout>
      <div className="px-8 py-7 max-w-3xl mx-auto">
        <PageHeader title="Instagram" subtitle="Conecte sua conta para responder DMs e receber mensagens automaticamente via Bot" />

        {/* Demo banner */}
        {!isConfigured && (
          <div className="flex items-center gap-3 p-3.5 rounded-xl border mb-5" style={{ background: '#fefce8', borderColor: '#fde68a' }}>
            <Zap size={15} style={{ color: '#d97706' }} />
            <p className="text-sm text-amber-800">
              <strong>Modo demonstração</strong> — Evolution API não configurada. Conexão simulada para visualização.
            </p>
          </div>
        )}

        {/* Status card */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)', boxShadow: '0 4px 14px rgba(225,48,108,0.3)' }}>
                <Instagram size={22} color="white" />
              </div>
              <div>
                <p className="font-bold text-foreground text-base">Instagram DM</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {status === 'connected' && <><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /><span className="text-xs text-emerald-600 font-semibold">Conectado</span></>}
                  {status === 'disconnected' && <><div className="w-2 h-2 rounded-full bg-gray-400" /><span className="text-xs text-muted-foreground">Desconectado</span></>}
                  {status === 'connecting' && <><div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /><span className="text-xs text-amber-600 font-semibold">Autorizando…</span></>}
                </div>
              </div>
            </div>
            {status === 'connected'
              ? <Button variant="outline" size="sm" className="text-xs gap-1.5 text-red-600 border-red-200 hover:bg-red-50" onClick={handleDisconnect}><WifiOff size={12} /> Desconectar</Button>
              : <Button size="sm" onClick={handleConnect} disabled={loading} className="text-xs gap-1.5 text-white" style={{ background: 'linear-gradient(135deg, #833ab4, #E1306C)' }}>
                  {loading ? <RefreshCw size={12} className="animate-spin" /> : <Instagram size={12} />} {loading ? 'Conectando…' : 'Conectar via OAuth'}
                </Button>
            }
          </div>

          {/* OAuth flow */}
          {status === 'connecting' && (
            <div className="space-y-2 mb-4">
              {[
                { step: 1, label: 'Autorizando via Evolution API', desc: 'Iniciando fluxo OAuth com a Meta' },
                { step: 2, label: 'Verificando permissões de DM', desc: 'instagram_manage_messages, pages_messaging' },
                { step: 3, label: 'Configurando webhook', desc: 'Registrando endpoint para receber DMs em tempo real' },
              ].map(s => (
                <div key={s.step} className="flex items-center gap-3 p-3 rounded-xl border border-border">
                  {oauthStep > s.step
                    ? <CheckCircle2 size={16} style={{ color: '#059669' }} />
                    : oauthStep === s.step
                    ? <RefreshCw size={16} className="animate-spin" style={{ color: '#6366f1' }} />
                    : <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
                  }
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Connected account info */}
          {status === 'connected' && account && (
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 flex items-center gap-3" style={{ background: 'linear-gradient(to right, #fdf2f8, #fdf4ff)' }}>
                <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ background: 'linear-gradient(135deg, #833ab4, #E1306C)' }}>
                  {account.displayName[0]}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-foreground">{account.displayName}</p>
                  <p className="text-xs text-muted-foreground">{account.username}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold text-white" style={{ background: '#E1306C' }}>
                  {account.accountType === 'business' ? 'Conta Comercial' : account.accountType === 'creator' ? 'Criador' : 'Pessoal'}
                </span>
              </div>
              <div className="grid grid-cols-3 divide-x divide-border px-0">
                {[
                  { label: 'Seguidores', value: account.followers.toLocaleString('pt-BR') },
                  { label: 'Seguindo', value: account.following.toLocaleString('pt-BR') },
                  { label: 'Status', value: '✅ Online' },
                ].map(({ label, value }) => (
                  <div key={label} className="px-4 py-3 text-center">
                    <p className="text-base font-bold text-foreground">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Restrição Instagram */}
        <div className="flex items-start gap-3 p-4 rounded-xl border mb-5" style={{ background: '#fff7ed', borderColor: '#fed7aa' }}>
          <AlertTriangle size={15} style={{ color: '#d97706', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p className="text-sm font-bold text-orange-800">⚠️ Limitação importante do Instagram</p>
            <p className="text-sm text-orange-700 mt-1 leading-relaxed">
              Diferente do WhatsApp, o Instagram <strong>não permite</strong> enviar mensagens para pessoas que ainda não seguem ou interagiram com sua conta.
              O Zapli usa o canal de Instagram para:
            </p>
            <ul className="mt-2 space-y-1">
              {[
                { icon: MessageCircle, text: 'Responder DMs recebidos automaticamente via Bot' },
                { icon: Users, text: 'Gerenciar conversas de quem já te segue ou iniciou contato' },
                { icon: Zap, text: 'Campanhas de follow-up para seguidores existentes' },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="text-xs text-orange-700 flex items-center gap-2">
                  <Icon size={11} /> {text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Capabilities */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { icon: MessageCircle, title: 'Receber DMs em tempo real', desc: 'Webhook captura mensagens assim que chegam', color: '#6366f1', ok: true },
            { icon: Zap, title: 'Bot de auto-resposta', desc: 'Regras configuradas na página Bot respondem automaticamente', color: '#059669', ok: true },
            { icon: Users, title: 'Campanhas para seguidores', desc: 'Disparos para quem já segue sua conta comercial', color: '#0ea5e9', ok: true },
            { icon: Lock, title: 'Cold outreach bloqueado', desc: 'Política Meta: não pode enviar DM para desconhecidos', color: '#ef4444', ok: false },
          ].map(({ icon: Icon, title, desc, color, ok }) => (
            <div key={title} className="bg-card rounded-xl border border-border p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
                <Icon size={15} style={{ color }} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-foreground">{title}</p>
                  <span style={{ color: ok ? '#059669' : '#ef4444', fontSize: 11 }}>{ok ? '✅' : '🚫'}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Setup guide */}
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><Info size={14} /> Como configurar</p>
          <div className="space-y-3">
            {[
              { n: 1, t: 'Configure o Evolution API no servidor', d: 'No seu VPS, certifique-se de ter a versão 1.8+ do Evolution API com suporte a Instagram.' },
              { n: 2, t: 'Adicione as variáveis de ambiente', d: 'VITE_EVOLUTION_URL, VITE_EVOLUTION_KEY e VITE_EVOLUTION_INSTANCE no arquivo .env do Zapli.' },
              { n: 3, t: 'Conta Business/Creator obrigatória', d: 'Apenas contas comerciais ou de criador do Instagram podem ser conectadas à API da Meta.' },
              { n: 4, t: 'Clique em "Conectar via OAuth"', d: 'Você será redirecionado para autorizar o Zapli na sua conta Meta Business.' },
            ].map(s => (
              <div key={s.n} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: '#E1306C' }}>{s.n}</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{s.t}</p>
                  <p className="text-xs text-muted-foreground">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
