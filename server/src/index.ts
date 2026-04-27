import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import qrcode from 'qrcode';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import path from 'path';
import fs from 'fs';

// ─── Configuração ─────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 3001;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];

const logger = pino({ level: 'warn' });

// ─── Estado global por tenant ─────────────────────────────────────────────────
interface TenantSession {
  socket: ReturnType<typeof makeWASocket> | null;
  status: 'offline' | 'connecting' | 'qr_ready' | 'connected';
  lastQR: string | null;           // QR code como base64 PNG
  lastQRRaw: string | null;        // QR code raw string
  profileName: string | null;
  profilePhone: string | null;
  clients: Set<WebSocket>;
}

const sessions = new Map<string, TenantSession>();

function getSession(tenantId: string): TenantSession {
  if (!sessions.has(tenantId)) {
    sessions.set(tenantId, {
      socket: null,
      status: 'offline',
      lastQR: null,
      lastQRRaw: null,
      profileName: null,
      profilePhone: null,
      clients: new Set(),
    });
  }
  return sessions.get(tenantId)!;
}

// ─── Broadcast para todos os WS conectados ao tenant ─────────────────────────
function broadcast(tenantId: string, data: object) {
  const session = sessions.get(tenantId);
  if (!session) return;
  const msg = JSON.stringify(data);
  session.clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  });
}

// ─── Conectar WhatsApp via Baileys ────────────────────────────────────────────
async function connectWhatsApp(tenantId: string) {
  const session = getSession(tenantId);

  // Pasta de autenticação por tenant
  const authDir = path.join(process.cwd(), 'auth_sessions', tenantId);
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    generateHighQualityLinkPreview: false,
    syncFullHistory: false,
  });

  session.socket = sock;
  session.status = 'connecting';
  broadcast(tenantId, { type: 'status', status: 'connecting' });

  // ── Eventos do socket ──────────────────────────────────────────────────────
  sock.ev.on('connection.update', async update => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      // Converte QR para base64 PNG
      try {
        const qrBase64 = await qrcode.toDataURL(qr, { errorCorrectionLevel: 'M', width: 300 });
        session.lastQR = qrBase64;
        session.lastQRRaw = qr;
        session.status = 'qr_ready';
        broadcast(tenantId, { type: 'qr', qr: qrBase64, qrRaw: qr });
        console.log(`[${tenantId}] QR gerado`);
      } catch (err) {
        console.error(`[${tenantId}] Erro ao gerar QR:`, err);
      }
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      session.status = 'offline';
      session.lastQR = null;
      session.lastQRRaw = null;
      broadcast(tenantId, { type: 'status', status: 'offline', reason: statusCode });

      console.log(`[${tenantId}] Desconectado. Código: ${statusCode}. Reconectar: ${shouldReconnect}`);

      if (shouldReconnect) {
        // Aguarda 3s antes de reconectar
        setTimeout(() => connectWhatsApp(tenantId), 3000);
      } else {
        // Usuário deslogou manualmente — apaga credenciais
        fs.rmSync(authDir, { recursive: true, force: true });
        sessions.delete(tenantId);
      }
    }

    if (connection === 'open') {
      session.status = 'connected';
      session.lastQR = null;
      session.profileName = sock.user?.name ?? null;
      session.profilePhone = sock.user?.id?.split(':')[0] ?? null;
      broadcast(tenantId, {
        type: 'connected',
        profileName: session.profileName,
        profilePhone: session.profilePhone,
      });
      console.log(`[${tenantId}] ✅ WhatsApp conectado! ${session.profilePhone}`);
    }
  });

  sock.ev.on('creds.update', saveCreds);

  // Mensagens recebidas
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      if (msg.key.fromMe) continue;
      const from = msg.key.remoteJid ?? '';
      const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        '';
      if (!text) continue;
      broadcast(tenantId, {
        type: 'message_received',
        from,
        text,
        timestamp: msg.messageTimestamp,
      });
      console.log(`[${tenantId}] 📩 ${from}: ${text.substring(0, 60)}`);
    }
  });
}

// ─── Express + HTTP server ────────────────────────────────────────────────────
const app = express();
app.use(cors({ origin: ALLOWED_ORIGINS.includes('*') ? '*' : ALLOWED_ORIGINS }));
app.use(express.json());

// Health check
app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'zapli-whatsapp', version: '1.0.0' });
});

// Status do tenant
app.get('/status/:tenantId', (req, res) => {
  const { tenantId } = req.params;
  const session = sessions.get(tenantId);
  res.json({
    tenantId,
    status: session?.status ?? 'offline',
    profileName: session?.profileName ?? null,
    profilePhone: session?.profilePhone ?? null,
    hasQR: !!session?.lastQR,
  });
});

// Iniciar conexão WhatsApp
app.post('/connect/:tenantId', async (req, res) => {
  const { tenantId } = req.params;
  const session = getSession(tenantId);

  if (session.status === 'connected') {
    return res.json({ status: 'already_connected', profilePhone: session.profilePhone });
  }

  if (session.status === 'connecting' || session.status === 'qr_ready') {
    return res.json({ status: session.status, hasQR: !!session.lastQR });
  }

  connectWhatsApp(tenantId).catch(err => {
    console.error(`[${tenantId}] Erro ao conectar:`, err);
  });

  res.json({ status: 'connecting' });
});

// Desconectar / logout
app.post('/disconnect/:tenantId', async (req, res) => {
  const { tenantId } = req.params;
  const session = sessions.get(tenantId);
  if (session?.socket) {
    await session.socket.logout().catch(() => {});
  }
  sessions.delete(tenantId);
  res.json({ status: 'disconnected' });
});

// Obter QR code atual
app.get('/qr/:tenantId', (req, res) => {
  const { tenantId } = req.params;
  const session = sessions.get(tenantId);
  if (!session?.lastQR) {
    return res.status(404).json({ error: 'QR não disponível. Inicie a conexão primeiro.' });
  }
  res.json({ qr: session.lastQR, qrRaw: session.lastQRRaw });
});

// Enviar mensagem de texto
app.post('/send', async (req, res) => {
  const { tenantId, phone, message } = req.body as {
    tenantId: string;
    phone: string;
    message: string;
  };

  if (!tenantId || !phone || !message) {
    return res.status(400).json({ error: 'tenantId, phone e message são obrigatórios.' });
  }

  const session = sessions.get(tenantId);
  if (!session?.socket || session.status !== 'connected') {
    return res.status(503).json({ error: 'WhatsApp não conectado para este tenant.' });
  }

  try {
    // Normaliza número: aceita 11987654321, 5511987654321, +5511987654321
    const normalized = phone.replace(/\D/g, '');
    const jid = normalized.includes('@') ? normalized : `${normalized.startsWith('55') ? normalized : '55' + normalized}@s.whatsapp.net`;

    await session.socket.sendMessage(jid, { text: message });
    res.json({ status: 'sent', to: jid });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[${tenantId}] Erro ao enviar:`, msg);
    res.status(500).json({ error: msg });
  }
});

// Enviar mensagem em lote
app.post('/send-batch', async (req, res) => {
  const { tenantId, messages } = req.body as {
    tenantId: string;
    messages: Array<{ phone: string; message: string }>;
  };

  if (!tenantId || !messages?.length) {
    return res.status(400).json({ error: 'tenantId e messages[] são obrigatórios.' });
  }

  const session = sessions.get(tenantId);
  if (!session?.socket || session.status !== 'connected') {
    return res.status(503).json({ error: 'WhatsApp não conectado para este tenant.' });
  }

  const results: Array<{ phone: string; status: string; error?: string }> = [];
  const DELAY_MS = 2000; // 2s entre mensagens para evitar ban

  for (const { phone, message } of messages) {
    try {
      const normalized = phone.replace(/\D/g, '');
      const jid = `${normalized.startsWith('55') ? normalized : '55' + normalized}@s.whatsapp.net`;
      await session.socket.sendMessage(jid, { text: message });
      results.push({ phone, status: 'sent' });
      await new Promise(r => setTimeout(r, DELAY_MS));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ phone, status: 'failed', error: msg });
    }
  }

  res.json({ results, total: messages.length, sent: results.filter(r => r.status === 'sent').length });
});

// ─── WebSocket Server ─────────────────────────────────────────────────────────
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

wss.on('connection', (ws, req) => {
  // URL: /ws?tenantId=xxx
  const url = new URL(req.url ?? '', `http://${req.headers.host}`);
  const tenantId = url.searchParams.get('tenantId');

  if (!tenantId) {
    ws.send(JSON.stringify({ type: 'error', message: 'tenantId obrigatório na URL: /ws?tenantId=xxx' }));
    ws.close();
    return;
  }

  const session = getSession(tenantId);
  session.clients.add(ws);
  console.log(`[${tenantId}] Cliente WS conectado. Total: ${session.clients.size}`);

  // Envia estado atual imediatamente
  ws.send(JSON.stringify({
    type: 'status',
    status: session.status,
    profileName: session.profileName,
    profilePhone: session.profilePhone,
    hasQR: !!session.lastQR,
  }));

  // Se já tem QR, envia imediatamente
  if (session.lastQR) {
    ws.send(JSON.stringify({ type: 'qr', qr: session.lastQR, qrRaw: session.lastQRRaw }));
  }

  ws.on('message', data => {
    try {
      const cmd = JSON.parse(data.toString()) as { action: string };
      if (cmd.action === 'connect') {
        if (session.status === 'offline') {
          connectWhatsApp(tenantId).catch(console.error);
        }
      } else if (cmd.action === 'disconnect') {
        session.socket?.logout().catch(() => {});
        sessions.delete(tenantId);
      }
    } catch { /* ignora mensagens malformadas */ }
  });

  ws.on('close', () => {
    session.clients.delete(ws);
    console.log(`[${tenantId}] Cliente WS desconectado. Total: ${session.clients.size}`);
  });

  ws.on('error', err => {
    console.error(`[WS ${tenantId}]`, err.message);
    session.clients.delete(ws);
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`✅ Zapli WhatsApp Server rodando na porta ${PORT}`);
  console.log(`   WebSocket: ws://localhost:${PORT}/ws?tenantId=SEU_TENANT_ID`);
  console.log(`   REST API:  http://localhost:${PORT}/`);
});
