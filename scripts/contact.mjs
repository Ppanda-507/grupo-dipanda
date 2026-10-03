import { site } from '../src/site.mjs';

export function validateContact(body, now = Date.now()) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'Pedido inválido.' };
  if (body.website) return { error: 'Não foi possível validar o pedido.' };
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (name.length < 2 || name.length > 120 || /[\r\n]/.test(name)) return { error: 'Indique um nome válido.' };
  if (email.length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) return { error: 'Indique um e-mail válido.' };
  if (message.length < 10 || message.length > 5000) return { error: 'A mensagem deve ter entre 10 e 5000 caracteres.' };
  if (!Number.isFinite(Number(body.startedAt)) || Number(body.startedAt) > now - 1200 || Number(body.startedAt) < now - 86400000) return { error: 'Atualize a página e tente novamente.' };
  return { value: { name, email, message } };
}

export async function sendContact(data, options = {}) {
  const environment = options.environment || process.env;
  const fetcher = options.fetcher || fetch;
  if (!environment.RESEND_API_KEY || !environment.CONTACT_FROM_EMAIL) return { status: 503, message: 'O envio pelo formulário ainda não está disponível.' };
  try {
    const response = await fetcher('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${environment.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: environment.CONTACT_FROM_EMAIL, to: [environment.CONTACT_TO_EMAIL || site.email], reply_to: data.email, subject: `Contacto Dipanda — ${data.name}`, text: `Nome: ${data.name}\nE-mail: ${data.email}\n\n${data.message}` }), signal: AbortSignal.timeout(15000)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || typeof result.id !== 'string') return { status: 502, message: 'Não foi possível confirmar o envio da mensagem. Tente mais tarde ou contacte-nos por e-mail.' };
    return { status: 200, message: 'A sua mensagem foi enviada. A equipa Dipanda entrará em contacto consigo.' };
  } catch { return { status: 502, message: 'Não foi possível confirmar o envio da mensagem. Contacte-nos por e-mail antes de repetir o pedido.' }; }
}
