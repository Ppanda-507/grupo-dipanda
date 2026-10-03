export const CONSENT_COOKIE = 'dipanda_consent';
export const CONSENT_VERSION = 1;
export const CONSENT_DAYS = 180;
export const OPTIONAL_COOKIES = ['dipanda_preferences'];

export function createConsent(functional, now = Date.now()) {
  return { version: CONSENT_VERSION, necessary: true, functional: functional === true, updatedAt: now, expiresAt: now + CONSENT_DAYS * 86400000 };
}

export function parseConsent(value, now = Date.now()) {
  try {
    const data = JSON.parse(decodeURIComponent(value));
    if (data.version !== CONSENT_VERSION || data.necessary !== true || typeof data.functional !== 'boolean' || !Number.isFinite(data.updatedAt) || !Number.isFinite(data.expiresAt) || data.updatedAt > now || data.expiresAt <= now || data.expiresAt - data.updatedAt !== CONSENT_DAYS * 86400000) return null;
    return data;
  } catch { return null; }
}

export function getCookie(name, cookieString) {
  return cookieString.split(';').map(item => item.trim()).find(item => item.startsWith(`${name}=`))?.slice(name.length + 1) ?? null;
}

export function cookieAttributes(protocol, maxAge = CONSENT_DAYS * 86400) {
  return `Path=/; Max-Age=${maxAge}; SameSite=Lax${protocol === 'https:' ? '; Secure' : ''}`;
}
