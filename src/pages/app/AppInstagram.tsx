import { AppLayout } from '@/components/AppLayout';
import { Clock, Instagram, Sparkles } from 'lucide-react';

export default function AppInstagram() {
  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">

        {/* Ícone animado */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}>
            <Instagram size={44} className="text-white" />
          </div>
          <div className="absolute -top-2 -right-2 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white"
            style={{ background: '#f59e0b' }}>
            <Clock size={10} />
            Em breve
          </div>
        </div>

        {/* Título */}
        <h1 className="text-2xl font-bold text-slate-800 mb-2 text-center">
          Prospecção via Instagram
        </h1>
        <p className="text-slate-500 text-center max-w-md mb-8 leading-relaxed">
          Em breve você poderá prospectar leads diretamente pelo Direct do Instagram,
          com o mesmo bot inteligente do WhatsApp — campanhas, follow-ups e CRM integrado.
        </p>

        {/* Features previstas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-lg mb-8">
          {[
            { icon: '📥', title: 'DM Automático',   desc: 'Envio de mensagens via Direct' },
            { icon: '🤖', title: 'Bot Integrado',   desc: 'Mesmo bot do WhatsApp' },
            { icon: '📊', title: 'CRM Unificado',   desc: 'Leads em um só lugar' },
          ].map(f => (
            <div key={f.title} className="rounded-xl border border-slate-200 p-4 text-center bg-white">
              <div className="text-2xl mb-2">{f.icon}</div>
              <p className="text-sm font-semibold text-slate-700">{f.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Badge */}
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-full border"
          style={{ background: '#fdf4ff', borderColor: '#e9d5ff' }}>
          <Sparkles size={14} style={{ color: '#a855f7' }} />
          <span className="text-sm font-medium" style={{ color: '#7e22ce' }}>
            Disponível no plano Pro e Enterprise — lançamento previsto em breve
          </span>
        </div>
      </div>
    </AppLayout>
  );
}
