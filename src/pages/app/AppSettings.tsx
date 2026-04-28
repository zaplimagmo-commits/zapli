import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/AppContext';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/UIComponents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Bell, Settings as SettingsIcon, Save, CheckCircle2, Loader2 } from 'lucide-react';
import { db } from '@/lib/supabase';

export default function AppSettings() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    companyName: '',
    followUpDays: '3',
    maxFollowUps: '3',
    notifyEmail: '',
    autoArchive: true,
    notifyOnPositive: true,
  });

  useEffect(() => {
    if (user?.tenantId) loadSettings();
  }, [user?.tenantId]);

  async function loadSettings() {
    setLoading(true);
    try {
      const { data: tenant } = await db
        .from('tenants')
        .select('*')
        .eq('id', user?.tenantId)
        .single();
      
      if (tenant) {
        setSettings({
          companyName: tenant.name || '',
          followUpDays: String(tenant.settings?.followUpDays || '3'),
          maxFollowUps: String(tenant.settings?.maxFollowUps || '3'),
          notifyEmail: tenant.settings?.notifyEmail || '',
          autoArchive: tenant.settings?.autoArchive ?? true,
          notifyOnPositive: tenant.settings?.notifyOnPositive ?? true,
        });
      }
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!user?.tenantId) return;
    
    try {
      await db.from('tenants').update({
        name: settings.companyName,
        settings: {
          followUpDays: Number(settings.followUpDays),
          maxFollowUps: Number(settings.maxFollowUps),
          notifyEmail: settings.notifyEmail,
          autoArchive: settings.autoArchive,
          notifyOnPositive: settings.notifyOnPositive,
        }
      }).eq('id', user.tenantId);

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Erro ao salvar:', err);
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-8 py-7 max-w-2xl mx-auto">
        <PageHeader title="Configurações" subtitle="Personalize o comportamento da prospecção real" />
        <div className="space-y-5">
          <div className="bg-card rounded-xl border border-border overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <Building2 size={14} className="text-primary" /><h2 className="font-semibold text-sm text-foreground">Dados da Empresa</h2>
            </div>
            <div className="p-5">
              <Label className="text-xs mb-1.5 block">Nome da empresa</Label>
              <Input value={settings.companyName} onChange={e => setSettings(s => ({ ...s, companyName: e.target.value }))} />
              <p className="text-xs text-muted-foreground mt-1">Usado nas mensagens como [Empresa]</p>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <SettingsIcon size={14} className="text-primary" /><h2 className="font-semibold text-sm text-foreground">Automação</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs mb-1.5 block">Dias para follow-up</Label>
                  <Select value={settings.followUpDays} onValueChange={v => setSettings(s => ({ ...s, followUpDays: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{['1','2','3','4','5','7'].map(d => <SelectItem key={d} value={d}>{d} {d === '1' ? 'dia' : 'dias'}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">Máx. de follow-ups</Label>
                  <Select value={settings.maxFollowUps} onValueChange={v => setSettings(s => ({ ...s, maxFollowUps: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{['1','2','3','4','5'].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">Arquivar após esgotar follow-ups</p>
                  <p className="text-xs text-muted-foreground">Move automaticamente para Arquivado</p>
                </div>
                <Switch checked={settings.autoArchive} onCheckedChange={v => setSettings(s => ({ ...s, autoArchive: v }))} />
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <Bell size={14} className="text-primary" /><h2 className="font-semibold text-sm text-foreground">Notificações</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Alertar resposta positiva</p>
                  <p className="text-xs text-muted-foreground">Cria alerta para equipe comercial</p>
                </div>
                <Switch checked={settings.notifyOnPositive} onCheckedChange={v => setSettings(s => ({ ...s, notifyOnPositive: v }))} />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">E-mail da equipe comercial (opcional)</Label>
                <Input value={settings.notifyEmail} onChange={e => setSettings(s => ({ ...s, notifyEmail: e.target.value }))} placeholder="comercial@empresa.com" type="email" />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} className="gap-2" style={{ background: 'var(--emerald)' }}>
              {saved ? <><CheckCircle2 size={14} /> Salvo!</> : <><Save size={14} /> Salvar Configurações</>}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
