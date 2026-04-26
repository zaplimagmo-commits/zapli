import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/UIComponents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Settings as SettingsIcon, Bell, Users, Save, CheckCircle2 } from 'lucide-react';

export default function Settings() {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    companyName: 'Construtora Exemplo',
    followUpDays: '3',
    maxFollowUps: '3',
    notifyEmail: '',
    notifyWhatsapp: '',
    autoArchive: true,
    sendNotifOnPositive: true,
  });

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <Layout>
      <div className="px-8 py-7 max-w-2xl mx-auto">
        <PageHeader
          title="Configurações"
          subtitle="Personalize o comportamento do agente de prospecção"
        />

        <div className="space-y-5">
          {/* Company */}
          <div className="bg-card rounded-xl border border-border overflow-hidden"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <Building2 size={15} className="text-primary" />
              <h2 className="font-semibold text-sm text-foreground">Dados da Construtora</h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <Label className="text-xs mb-1.5 block">Nome da Construtora</Label>
                <Input value={settings.companyName}
                  onChange={e => setSettings(s => ({ ...s, companyName: e.target.value }))}
                  placeholder="Construtora Exemplo" />
                <p className="text-xs text-muted-foreground mt-1">
                  Usado nas mensagens como [Construtora]
                </p>
              </div>
            </div>
          </div>

          {/* Automation */}
          <div className="bg-card rounded-xl border border-border overflow-hidden"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <SettingsIcon size={15} className="text-primary" />
              <h2 className="font-semibold text-sm text-foreground">Automação de Follow-ups</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs mb-1.5 block">Dias sem resposta para follow-up</Label>
                  <Select value={settings.followUpDays}
                    onValueChange={v => setSettings(s => ({ ...s, followUpDays: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['1', '2', '3', '4', '5', '7'].map(d => (
                        <SelectItem key={d} value={d}>{d} {d === '1' ? 'dia' : 'dias'}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">Máximo de follow-ups por contato</Label>
                  <Select value={settings.maxFollowUps}
                    onValueChange={v => setSettings(s => ({ ...s, maxFollowUps: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['1', '2', '3', '4', '5'].map(d => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between py-2 border-t border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">Arquivar após esgotar follow-ups</p>
                  <p className="text-xs text-muted-foreground">
                    Move automaticamente para "Arquivado" após o último follow-up
                  </p>
                </div>
                <Switch
                  checked={settings.autoArchive}
                  onCheckedChange={v => setSettings(s => ({ ...s, autoArchive: v }))}
                />
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-card rounded-xl border border-border overflow-hidden"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <Bell size={15} className="text-primary" />
              <h2 className="font-semibold text-sm text-foreground">Notificações Comerciais</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium text-foreground">Notificar ao receber resposta positiva</p>
                  <p className="text-xs text-muted-foreground">
                    Cria alerta no painel para a equipe comercial
                  </p>
                </div>
                <Switch
                  checked={settings.sendNotifOnPositive}
                  onCheckedChange={v => setSettings(s => ({ ...s, sendNotifOnPositive: v }))}
                />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">E-mail da equipe comercial (opcional)</Label>
                <Input
                  value={settings.notifyEmail}
                  onChange={e => setSettings(s => ({ ...s, notifyEmail: e.target.value }))}
                  placeholder="comercial@construtora.com.br"
                  type="email"
                />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">WhatsApp da equipe comercial (opcional)</Label>
                <Input
                  value={settings.notifyWhatsapp}
                  onChange={e => setSettings(s => ({ ...s, notifyWhatsapp: e.target.value }))}
                  placeholder="11999999999"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Número para encaminhar alertas de oportunidades
                </p>
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} className="gap-2">
              {saved ? (
                <>
                  <CheckCircle2 size={15} />
                  Salvo!
                </>
              ) : (
                <>
                  <Save size={15} />
                  Salvar Configurações
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
