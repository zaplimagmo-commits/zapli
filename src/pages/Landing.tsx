import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap, ArrowRight, Star, TrendingUp, Shield, Clock,
  MessageCircle, Instagram, Bot, Megaphone, Target, Users, BarChart2,
  Play, Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/index';

const STATS = [
  { value: '34%', label: 'taxa de resposta média', sub: 'vs 8% do e-mail' },
  { value: '12x', label: 'mais reuniões/mês', sub: 'vs prospecção manual' },
  { value: '< 2min', label: 'para criar uma campanha', sub: 'sem nenhum técnico' },
  { value: 'R$0,80', label: 'custo por lead contactado', sub: 'vs R$15+ de ads' },
];

const FEATURES = [
  { icon: '🎯', title: 'Lead Score Inteligente', desc: 'Cada contato recebe uma pontuação automática de 0–100. Foque sua energia nos leads mais quentes.' },
  { icon: '⚡', title: 'Prospecção Ativa WA + IG', desc: 'Dispare mensagens personalizadas pelo WhatsApp e Instagram com variáveis automáticas por contato.' },
  { icon: '🤖', title: 'Bot de Auto-Resposta', desc: 'Configure regras inteligentes: detectar interesse, responder perguntas de preço, escalar para humano.' },
  { icon: '📣', title: 'Campanhas Segmentadas', desc: 'Selecione sua base por segmento, status ou tag. Disparo em massa com anti-bloqueio nativo.' },
  { icon: '🏆', title: 'CRM com Win-Rate', desc: 'Kanban de 6 estágios com receita ponderada, probabilidade de fechamento e pipeline health score.' },
  { icon: '📊', title: 'Dashboard Executivo', desc: 'Funil com drop-off, atividade em tempo real, top produtos, custo por lead e LTV médio.' },
  { icon: '👥', title: 'CRM de Clientes 360°', desc: 'Histórico completo, produtos vendidos, propostas, LTV, MRR e health score por cliente.' },
  { icon: '🛡️', title: 'Anti-Bloqueio Embutido', desc: 'Intervalos aleatórios, warm-up gradual, limites diários e horário comercial — sem risco de ban.' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      <nav className="sticky top-0 z-50 border-b border-white/20 backdrop-blur-xl" style={{ background: 'rgba(248,250,252,0.92)' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md" style={{ background: 'var(--sidebar)' }}>
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="font-black text-xl tracking-tight text-foreground">Zapli</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to={ROUTES.LOGIN}>
              <Button variant="ghost" size="sm" className="text-sm">Entrar</Button>
            </Link>
            <Button onClick={() => navigate(ROUTES.REGISTER)} size="sm" className="text-sm text-white font-semibold"
              style={{ background: 'var(--emerald)' }}>
              Começar agora →
            </Button>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden pt-20 pb-24">
        <div className="max-w-5xl mx-auto px-6 text-center relative">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-7 text-sm font-semibold"
            style={{ background: '#eef2ff', borderColor: '#c7d2fe', color: '#6366f1' }}>
            <Zap size={13} /> Prospecção Inteligente para Times B2B
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-black tracking-tight text-foreground leading-tight mb-6">
            Transforme contatos em<br />
            <span style={{ background: 'linear-gradient(135deg, #6366f1, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Clientes Reais
            </span><br />
            pelo WhatsApp.
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto mb-9 leading-relaxed">
            CRM + Bot + Campanhas + Lead Score — a plataforma completa para escalar sua prospecção ativa sem complicação.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <Button onClick={() => navigate(ROUTES.REGISTER)} size="lg"
              className="text-base px-8 py-6 font-bold text-white gap-2 shadow-xl"
              style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 10px 40px rgba(99,102,241,0.35)' }}>
              Criar minha conta <ArrowRight size={16} />
            </Button>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {STATS.map((s, i) => (
              <motion.div key={s.value} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1 }}
                className="bg-white rounded-2xl border border-border p-4 shadow-sm text-center">
                <p className="text-2xl font-black" style={{ color: '#6366f1' }}>{s.value}</p>
                <p className="text-xs font-semibold text-foreground mt-0.5">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20" style={{ background: 'white' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="p-6 rounded-2xl border border-border hover:shadow-lg transition-all">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
