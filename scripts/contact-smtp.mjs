import { site } from '../src/site.mjs';

export function smtpOptions(environment = process.env) {
  const host = environment.SMTP_HOST || 'smtp.hostinger.com';
  const port = Number(environment.SMTP_PORT || 465);
  const user = environment.SMTP_USER || site.email;
  const pass = environment.SMTP_PASSWORD;
  if (!pass || typeof pass !== 'string' || /[\r\n\0]/.test(pass) || ![465, 587].includes(port)
    || !/^[a-z0-9.-]+$/i.test(host) || /[\r\n\0]/.test(user) || !user.includes('@')) return null;
  return {
    host, port, secure: port === 465, requireTLS: port === 587,
    auth: { user, pass }, tls: { minVersion: 'TLSv1.2' },
    connectionTimeout: 8000, greetingTimeout: 8000, socketTimeout: 12000,
    dnsTimeout: 8000, disableFileAccess: true, disableUrlAccess: true,
    logger: false, debug: false,
  };
}

export async function sendSmtpContact(data, options = {}) {
  const environment = options.environment || process.env;
  const settings = smtpOptions(environment);
  if (!settings) return { status: 503, message: 'O envio pelo formulário ainda não está configurado. Contacte-nos por e-mail.' };
  const to = environment.CONTACT_TO_EMAIL || site.email;
  const from = environment.CONTACT_FROM_EMAIL || settings.auth.user;
  if ([to, from].some(value => /[\r\n\0]/.test(value))) return { status: 503, message: 'O formulário está temporariamente indisponível.' };
  let transport, timer;
  try {
    const createTransport = options.createTransport || (await import('nodemailer')).default.createTransport;
    transport = createTransport(settings);
    const deadline = new Promise((_, reject) => {
      timer = setTimeout(() => { transport.close?.(); reject(new Error('SMTP timeout')); }, 20000);
    });
    const result = await Promise.race([transport.sendMail({
      from, to, replyTo: { name: data.name, address: data.email },
      subject: `Contacto Dipanda — ${data.name}`,
      text: `Nome: ${data.name}\nE-mail: ${data.email}\n\n${data.message}`,
      disableFileAccess: true, disableUrlAccess: true,
    }), deadline]);
    const accepted = result.accepted?.some(address => String(address).toLowerCase() === to.toLowerCase());
    if (!accepted || result.rejected?.length) throw new Error('SMTP did not accept recipient');
    return { status: 200, message: 'A sua mensagem foi enviada. A equipa Dipanda entrará em contacto consigo.' };
  } catch {
    return { status: 502, message: 'Não foi possível confirmar o envio da mensagem. Contacte-nos por e-mail antes de repetir o pedido.' };
  } finally {
    clearTimeout(timer);
    transport?.close?.();
  }
}
