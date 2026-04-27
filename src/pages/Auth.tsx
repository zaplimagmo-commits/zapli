import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/AppContext';
import { ROUTES, PLANS } from '@/lib/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 600));
    const ok = login(email, password);
    setLoading(false);
    if (ok) {
      const cred = { 'admin@zapli.io': ROUTES.ADMIN_DASHBOARD };
      navigate(cred[email as keyof typeof cred] || ROUTES.APP_DASHBOARD);
    } else {
      setError('E-mail ou senha incorretos.');
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#f8fafc' }}>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-10 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #1e293b 100%)' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 70%, #6366f1 0%, transparent 50%), radial-gradient(circle at 80% 20%, #10b981 0%, transparent 40%)' }} />
        <Link to="/" className="flex items-center gap-2 relative z-10">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--emerald)' }}>
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-lg">Zapli</span>
        </Link>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white mb-4">Bem-vindo de volta!</h2>
          <p className="text-indigo-200 mb-8">Acesse sua conta e continue transformando contatos em clientes.</p>
          <div className="space-y-3">
            {['Follow-up automático em dias certos', 'Dashboard com funil em tempo real', 'Alertas para equipe comercial'].map(f => (
              <div key={f} className="flex items-center gap-2.5">
                <CheckCircle2 size={15} style={{ color: 'var(--emerald)', flexShrink: 0 }} />
                <span className="text-sm text-indigo-200">{f}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10">
          <p className="text-xs text-indigo-300">© 2026 Zapli. Todos os direitos reservados.</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft size={14} /> Voltar ao início
          </Link>

          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--emerald)' }}>
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-foreground text-lg">Zapli</span>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-1">Entrar na conta</h1>
          <p className="text-muted-foreground text-sm mb-7">Use suas credenciais para acessar o painel.</p>

          {/* Demo credentials hint */}
          <div className="rounded-lg p-3 mb-5 text-xs" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <p className="font-semibold text-emerald-800 mb-1">Contas demo:</p>
            <p className="text-emerald-700">👤 <code>pro@demo.com</code> / <code>demo123</code> — Usuário Pro</p>
            <p className="text-emerald-700">🛡️ <code>admin@zapli.io</code> / <code>admin123</code> — Admin</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-sm mb-1.5 block">E-mail</Label>
              <Input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Senha</Label>
              <div className="relative">
                <Input type={showPwd ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="pr-10" />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full font-semibold h-10" disabled={loading} style={{ background: 'var(--emerald)' }}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Não tem conta?{' '}
            <Link to={ROUTES.REGISTER} className="font-semibold hover:underline" style={{ color: 'var(--emerald)' }}>
              Criar grátis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultPlan = searchParams.get('plan') || 'starter';

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '', segment: '', planId: defaultPlan });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    register(form.name, form.email, form.password, form.company, form.planId);
    setLoading(false);
    navigate(ROUTES.APP_DASHBOARD);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#f8fafc' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--emerald)' }}>
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-foreground text-lg">Zapli</span>
          </Link>
        </div>

        <div className="bg-card rounded-2xl border border-border p-8" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-7">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= s ? 'text-white' : 'text-muted-foreground bg-muted'}`}
                  style={step >= s ? { background: 'var(--emerald)' } : {}}>
                  {step > s ? <CheckCircle2 size={14} /> : s}
                </div>
                <span className={`text-xs font-medium ${step >= s ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {s === 1 ? 'Seus dados' : 'Escolha o plano'}
                </span>
                {s < 2 && <div className={`flex-1 h-px ${step > s ? '' : 'bg-border'}`} style={step > s ? { background: 'var(--emerald)' } : {}} />}
              </div>
            ))}
          </div>

          <h1 className="text-xl font-bold text-foreground mb-5">
            {step === 1 ? 'Crie sua conta' : 'Escolha seu plano'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label className="text-xs mb-1.5 block">Nome completo</Label>
                    <Input placeholder="Seu nome" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs mb-1.5 block">E-mail corporativo</Label>
                    <Input type="email" placeholder="nome@empresa.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs mb-1.5 block">Senha</Label>
                    <Input type="password" placeholder="Mínimo 8 caracteres" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} />
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block">Nome da empresa</Label>
                    <Input placeholder="Minha Empresa" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} required />
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block">Segmento</Label>
                    <Input placeholder="Ex: Construtora" value={form.segment} onChange={e => setForm(f => ({ ...f, segment: e.target.value }))} />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                {Object.values(PLANS).map(plan => (
                  <label key={plan.id} className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${form.planId === plan.id ? 'border-emerald-400' : 'border-border hover:border-primary/30'}`}
                    style={form.planId === plan.id ? { background: '#f0fdf4' } : {}}>
                    <input type="radio" name="plan" value={plan.id} checked={form.planId === plan.id} onChange={() => setForm(f => ({ ...f, planId: plan.id }))} className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{plan.name}</span>
                        {plan.highlight && (
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded text-white" style={{ background: 'var(--emerald)', fontSize: 9 }}>POPULAR</span>
                        )}
                      </div>
                      <p className="text-lg font-bold text-foreground">R$ {plan.price}/mês</p>
                      <p className="text-xs text-muted-foreground">
                        {plan.maxContacts ? `${plan.maxContacts} contatos` : 'Contatos ilimitados'} · {plan.maxFollowUps} follow-ups · {plan.maxUsers ? `${plan.maxUsers} usuário${plan.maxUsers > 1 ? 's' : ''}` : 'Ilimitados'}
                      </p>
                    </div>
                  </label>
                ))}
                <p className="text-xs text-muted-foreground text-center pt-1">🎉 14 dias grátis · Cancele quando quiser</p>
              </div>
            )}
            <Button type="submit" className="w-full font-semibold h-10 mt-2" disabled={loading} style={{ background: 'var(--emerald)' }}>
              {loading ? 'Criando conta...' : step === 1 ? 'Continuar →' : 'Criar conta grátis'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-5">
            Já tem conta?{' '}
            <Link to={ROUTES.LOGIN} className="font-semibold hover:underline" style={{ color: 'var(--emerald)' }}>
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
