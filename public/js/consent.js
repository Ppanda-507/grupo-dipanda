import { CONSENT_COOKIE, OPTIONAL_COOKIES, createConsent, parseConsent, getCookie, cookieAttributes } from './consent-core.js';
import { setMotionPaused, isMotionPaused } from './motion.js';

export function initConsent() {
  const banner = document.querySelector('[data-cookie-banner]');
  const dialog = document.querySelector('[data-cookie-dialog]');
  if (!banner || !dialog) return;
  const functionalToggle = dialog.querySelector('[name="functional"]');
  let consent = parseConsent(getCookie(CONSENT_COOKIE, document.cookie));
  let returnFocus = null;
  let applyingPreference = false;
  let storageFailed = false;
  let expiryTimer;
  let channel;
  try { channel = new BroadcastChannel('dipanda-consent'); } catch { /* Focus/pageshow still reconcile the shared cookie. */ }

  function readConsent() {
    return storageFailed ? null : parseConsent(getCookie(CONSENT_COOKIE, document.cookie));
  }
  function notify() {
    document.dispatchEvent(new CustomEvent('dipanda:consent-change', { detail: consent }));
  }
  function reconcile() {
    const previous = JSON.stringify(consent);
    consent = readConsent();
    if (!consent?.functional) removeOptionalCookies();
    banner.hidden = Boolean(consent);
    if (dialog.open) functionalToggle.checked = consent?.functional === true;
    clearTimeout(expiryTimer);
    // Long-lived tabs must not retain authorization after the consent expires.
    if (consent) expiryTimer = setTimeout(reconcile, Math.min(Math.max(1, consent.expiresAt - Date.now()), 2147483647));
    if (previous !== JSON.stringify(consent)) notify();
    return consent;
  }

  function removeOptionalCookies() {
    OPTIONAL_COOKIES.forEach(name => { document.cookie = `${name}=; ${cookieAttributes(location.protocol, 0)}`; });
  }
  function savePreference() {
    if (applyingPreference || !reconcile()?.functional) return;
    const remaining = Math.floor((consent.expiresAt - Date.now()) / 1000);
    if (remaining <= 0) { removeOptionalCookies(); return; }
    document.cookie = `dipanda_preferences=${encodeURIComponent(JSON.stringify({ motionPaused: isMotionPaused() }))}; ${cookieAttributes(location.protocol, remaining)}`;
  }
  function applyConsent() {
    if (!consent?.functional) { removeOptionalCookies(); return; }
    try {
      const preferences = JSON.parse(decodeURIComponent(getCookie('dipanda_preferences', document.cookie) || 'null'));
      if (typeof preferences?.motionPaused === 'boolean') {
        applyingPreference = true;
        setMotionPaused(preferences.motionPaused);
      }
    } catch { removeOptionalCookies(); }
    finally { applyingPreference = false; }
  }
  function save(functional) {
    const chosen = createConsent(functional);
    document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(chosen))}; ${cookieAttributes(location.protocol)}`;
    storageFailed = false;
    consent = readConsent();
    if (!consent || consent.updatedAt !== chosen.updatedAt || consent.functional !== chosen.functional || consent.expiresAt !== chosen.expiresAt) {
      storageFailed = true;
      consent = null;
      const status = dialog.open ? dialog.querySelector('[data-cookie-status]') : banner.querySelector('[data-cookie-status]');
      status.textContent = 'O navegador não permite guardar cookies. Apenas as funcionalidades essenciais serão usadas.';
      removeOptionalCookies();
      banner.hidden = false;
      notify();
      return;
    }
    applyConsent();
    if (consent.functional) savePreference();
    if (dialog.open) dialog.close();
    reconcile();
    notify();
    channel?.postMessage('changed');
  }
  function openSettings(event) {
    reconcile();
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
  channel?.addEventListener('message', () => { reconcile(); applyConsent(); });
  window.addEventListener('pageshow', () => { reconcile(); applyConsent(); });
  window.addEventListener('focus', reconcile);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) reconcile(); });
  reconcile();
  applyConsent();
  banner.hidden = Boolean(consent);
}
