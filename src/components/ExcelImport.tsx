import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, Download, X, Plus } from 'lucide-react';
import type { Contact } from '@/lib/index';

type ImportRow = Partial<Omit<Contact, 'id' | 'userId' | 'createdAt' | 'messages' | 'followUpCount' | 'status' | 'lastContactAt' | 'nextFollowUpAt' | 'maxFollowUps'>>;

const REQUIRED_FIELDS = ['name', 'phone', 'company'] as const;

const FIELD_LABELS: Record<string, string> = {
  name: 'Nome *',
  phone: 'WhatsApp *',
  company: 'Empresa *',
  email: 'E-mail',
  city: 'Cidade',
  state: 'Estado',
  segment: 'Segmento',
  notes: 'Observações',
};

const COMMON_ALIASES: Record<string, string> = {
  nome: 'name', 'primeiro nome': 'name', 'contato': 'name',
  telefone: 'phone', celular: 'phone', whatsapp: 'phone', fone: 'phone', 'tel': 'phone',
  empresa: 'company', 'razão social': 'company', 'escritório': 'company', cliente: 'company',
  email: 'email', 'e-mail': 'email',
  cidade: 'city',
  estado: 'state', uf: 'state',
  segmento: 'segment', área: 'segment', setor: 'segment', ramo: 'segment',
  observações: 'notes', obs: 'notes', nota: 'notes',
};

function guessField(header: string): string {
  const normalized = header.toLowerCase().trim();
  return COMMON_ALIASES[normalized] || normalized;
}

function parseCSV(text: string): string[][] {
  const lines = text.trim().split(/\r?\n/);
  return lines.map(line => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') { inQuotes = !inQuotes; continue; }
      if ((line[i] === ',' || line[i] === ';' || line[i] === '\t') && !inQuotes) {
        result.push(current.trim()); current = '';
      } else {
        current += line[i];
      }
    }
    result.push(current.trim());
    return result;
  });
}

interface ExcelImportProps {
  open: boolean;
  onClose: () => void;
  onImport: (contacts: ImportRow[]) => void;
}

export default function ExcelImport({ open, onClose, onImport }: ExcelImportProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<'upload' | 'map' | 'preview' | 'done'>('upload');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [fieldMap, setFieldMap] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);

  function reset() {
    setStep('upload'); setHeaders([]); setRows([]); setFieldMap({}); setPreview([]); setFileName(''); setError('');
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = parseCSV(text);
        if (parsed.length < 2) { setError('Arquivo vazio ou inválido.'); return; }
        const hdrs = parsed[0];
        const dataRows = parsed.slice(1).filter(r => r.some(c => c.trim()));
        setHeaders(hdrs);
        setRows(dataRows);
        // Auto-map
        const autoMap: Record<string, string> = {};
        hdrs.forEach(h => { const guessed = guessField(h); if (FIELD_LABELS[guessed]) autoMap[h] = guessed; });
        setFieldMap(autoMap);
        setStep('map');
      } catch {
        setError('Erro ao ler o arquivo. Use formato CSV (UTF-8) ou Excel exportado como CSV.');
      }
    };
    reader.readAsText(file, 'UTF-8');
  }

  function buildPreview() {
    const mapped = rows.slice(0, 5).map(row => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { if (fieldMap[h]) obj[fieldMap[h]] = row[i] || ''; });
      return obj as ImportRow;
    });
    setPreview(mapped);
    setStep('preview');
  }

  function hasRequiredFields() {
    return REQUIRED_FIELDS.every(f => Object.values(fieldMap).includes(f));
  }

  async function handleImport() {
    setImporting(true);
    const allContacts = rows.map(row => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { if (fieldMap[h]) obj[fieldMap[h]] = row[i] || ''; });
      return obj as ImportRow;
    }).filter(c => c.name && c.phone);
    await new Promise(r => setTimeout(r, 800));
    onImport(allContacts);
    setImporting(false);
    setStep('done');
  }

  function downloadTemplate() {
    const csv = 'Nome,WhatsApp,Empresa,Email,Cidade,Estado,Segmento\nJoão Silva,11987654321,Silva Engenharia,joao@silva.com,São Paulo,SP,Engenharia\nMaria Santos,21976543210,Santos Ltda,maria@santos.com,Rio de Janeiro,RJ,Consultoria';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'modelo_zapli.csv'; a.click();
  }

  return (
    <Dialog open={open} onOpenChange={() => { reset(); onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet size={18} style={{ color: '#059669' }} />
            Importar Contatos via Excel / CSV
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-2">
          {[{ label: 'Upload', key: 'upload' }, { label: 'Mapear', key: 'map' }, { label: 'Revisar', key: 'preview' }].map((s, i) => {
            const steps = ['upload', 'map', 'preview', 'done'];
            const current = steps.indexOf(step);
            const idx = i;
            const done = current > idx;
            const active = current === idx;
            return (
              <div key={s.key} className="flex items-center">
                <div className="flex items-center gap-1.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors`}
                    style={{ background: done || active ? 'var(--emerald)' : 'var(--muted)', color: done || active ? 'white' : 'var(--muted-foreground)' }}>
                    {done ? <CheckCircle2 size={12} /> : idx + 1}
                  </div>
                  <span className={`text-xs font-medium ${active ? 'text-foreground' : 'text-muted-foreground'}`}>{s.label}</span>
                </div>
                {i < 2 && <div className="w-8 h-px bg-border mx-2" />}
              </div>
            );
          })}
        </div>

        {/* STEP 1: UPLOAD */}
        {step === 'upload' && (
          <div className="space-y-4 py-2">
            <div
              className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30"
              style={{ borderColor: 'var(--border)' }}
              onClick={() => fileRef.current?.click()}>
              <Upload size={32} className="mx-auto text-muted-foreground mb-3" />
              <p className="font-semibold text-foreground text-sm mb-1">Clique para selecionar o arquivo</p>
              <p className="text-xs text-muted-foreground">Aceita .CSV, .TXT (separado por vírgula, ponto-e-vírgula ou tab)</p>
              <p className="text-xs text-muted-foreground mt-1">Para Excel (.xlsx): salve como <strong>CSV UTF-8</strong> antes de enviar</p>
              <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
            </div>
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg text-sm" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                <AlertTriangle size={14} /> {error}
              </div>
            )}
            <div className="flex items-center justify-between p-3 rounded-lg border" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
              <div>
                <p className="text-sm font-medium text-emerald-800">Baixe nosso modelo</p>
                <p className="text-xs text-emerald-700">Preencha o modelo e importe com um clique</p>
              </div>
              <Button size="sm" variant="outline" onClick={downloadTemplate} className="gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                <Download size={13} /> Baixar modelo
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: MAP */}
        {step === 'map' && (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">
                <span className="text-primary font-bold">{rows.length}</span> linhas encontradas em <strong>{fileName}</strong>
              </p>
              {!hasRequiredFields() && (
                <div className="flex items-center gap-1.5 text-xs text-amber-600">
                  <AlertTriangle size={12} /> Mapeie Nome, WhatsApp e Empresa
                </div>
              )}
            </div>
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-2.5 bg-muted/30 border-b border-border grid grid-cols-2 gap-4">
                <span className="text-xs font-semibold text-muted-foreground">COLUNA NO ARQUIVO</span>
                <span className="text-xs font-semibold text-muted-foreground">MAPEAR PARA</span>
              </div>
              <div className="divide-y divide-border max-h-64 overflow-y-auto">
                {headers.map(h => (
                  <div key={h} className="px-4 py-2.5 grid grid-cols-2 gap-4 items-center">
                    <span className="text-sm text-foreground font-medium truncate">{h}</span>
                    <Select value={fieldMap[h] || '__skip__'} onValueChange={v => setFieldMap(prev => ({ ...prev, [h]: v === '__skip__' ? '' : v }))}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__skip__"><span className="text-muted-foreground">Ignorar coluna</span></SelectItem>
                        {Object.entries(FIELD_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: PREVIEW */}
        {step === 'preview' && (
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <CheckCircle2 size={15} style={{ color: '#059669' }} />
              <p className="text-sm font-medium text-emerald-800">
                <strong>{rows.length}</strong> contatos prontos para importar.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">Prévia dos primeiros 5 registros:</p>
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    {Object.values(fieldMap).filter(Boolean).map(f => (
                      <th key={f} className="text-left px-3 py-2 font-semibold text-muted-foreground">{FIELD_LABELS[f] || f}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {preview.map((row, i) => (
                    <tr key={i} className="hover:bg-muted/20">
                      {Object.values(fieldMap).filter(Boolean).map(f => (
                        <td key={f} className="px-3 py-2 text-foreground truncate max-w-24">{(row as Record<string, unknown>)[f] as string || '—'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STEP 4: DONE */}
        {step === 'done' && (
          <div className="py-8 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: '#d1fae5' }}>
              <CheckCircle2 size={28} style={{ color: '#059669' }} />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">Importação concluída!</h3>
            <p className="text-sm text-muted-foreground">{rows.length} contatos adicionados à sua lista de prospecção.</p>
          </div>
        )}

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
          )}
          {step === 'map' && (
            <>
              <Button variant="outline" onClick={() => { setStep('upload'); if (fileRef.current) fileRef.current.value = ''; }}>Voltar</Button>
              <Button onClick={buildPreview} disabled={!hasRequiredFields()} style={{ background: 'var(--emerald)' }}>
                Revisar importação →
              </Button>
            </>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('map')}>Voltar</Button>
              <Button onClick={handleImport} disabled={importing} style={{ background: 'var(--emerald)' }}>
                {importing ? 'Importando...' : <><Plus size={14} className="mr-1" /> Importar {rows.length} contatos</>}
              </Button>
            </>
          )}
          {step === 'done' && (
            <Button onClick={() => { reset(); onClose(); }} style={{ background: 'var(--emerald)' }}>
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
