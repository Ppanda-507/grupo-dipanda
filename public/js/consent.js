import { CONSENT_COOKIE, OPTIONAL_COOKIES, createConsent, parseConsent, getCookie, cookieAttributes } from './consent-core.js';
import { setMotionPaused, isMotionPaused } from './motion.js';

export function initConsent() {
  const banner = document.querySelector('[data-cookie-banner]');
  const dialog = document.querySelector('[data-cookie-dialog]');
  if (!banner || !dialog) return;
  const functionalToggle = dialog.querySelector('[name="functional"]');
  let consent = parseConsent(getCookie(CONSENT_COOKIE, document.cookie));
  let returnFocus = null;

  function removeOptionalCookies() {
    OPTIONAL_COOKIES.forEach(name => { document.cookie = `${name}=; ${cookieAttributes(location.protocol, 0)}`; });
  }
  function savePreference() {
    if (!consent?.functional) return;
    document.cookie = `dipanda_preferences=${encodeURIComponent(JSON.stringify({ motionPaused: isMotionPaused() }))}; ${cookieAttributes(location.protocol)}`;
  }
  function applyConsent() {
    if (!consent?.functional) { removeOptionalCookies(); return; }
    try {
      const preferences = JSON.parse(decodeURIComponent(getCookie('dipanda_preferences', document.cookie) || 'null'));
      if (typeof preferences?.motionPaused === 'boolean') setMotionPaused(preferences.motionPaused);
    } catch { removeOptionalCookies(); }
  }
  function save(functional) {
    const chosen = createConsent(functional);
    document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(chosen))}; ${cookieAttributes(location.protocol)}`;
    consent = parseConsent(getCookie(CONSENT_COOKIE, document.cookie));
    if (!consent) {
      const status = dialog.open ? dialog.querySelector('[data-cookie-status]') : banner.querySelector('[data-cookie-status]');
      status.textContent = 'O navegador não permite guardar cookies. Apenas as funcionalidades essenciais serão usadas.';
      removeOptionalCookies();
      return;
    }
    applyConsent();
    if (consent.functional) savePreference();
    banner.hidden = true;
    if (dialog.open) dialog.close();
    document.dispatchEvent(new CustomEvent('dipanda:consent-change', { detail: consent }));
  }
  function openSettings(event) {
    returnFocus = event?.currentTarget || document.activeElement;
    functionalToggle.checked = consent?.functional === true;
    dialog.querySelector('[data-cookie-status]').textContent = '';
    if (!dialog.open) dialog.showModal();
  }
  document.querySelectorAll('[data-cookie-settings]').forEach(button => button.addEventListener('click', openSettings));
  document.querySelectorAll('[data-cookie-accept]').forEach(button => button.addEventListener('click', () => save(true)));
  document.querySelectorAll('[data-cookie-reject]').forEach(button => button.addEventListener('click', () => save(false)));
  dialog.querySelector('[data-cookie-save]').addEventListener('click', () => save(functionalToggle.checked));
  dialog.querySelector('[data-cookie-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { returnFocus?.focus({ preventScroll: true }); });
  dialog.addEventListener('click', event => { if (event.target === dialog) { const bounds = dialog.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close(); } });
  document.addEventListener('dipanda:motion-change', savePreference);
  applyConsent();
  banner.hidden = Boolean(consent);
}
