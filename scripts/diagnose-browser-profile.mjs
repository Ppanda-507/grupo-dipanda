import { chromium, firefox, webkit } from 'playwright-core';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';

const engine = process.env.BROWSER_ENGINE || 'chromium';
const type = { chromium, firefox, webkit }[engine];
const origin = new URL(process.env.TEST_URL || 'http://127.0.0.1:4173').origin;
assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(new URL(origin).hostname));
const profile = await fs.mkdtemp(path.join(os.tmpdir(), `dipanda-profile-${engine}-`));
const options = { headless: true, ignoreHTTPSErrors: true, timeout: 30000,
  ...(engine === 'chromium' ? { channel: 'chromium' } : {}),
  ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}),
  ...(engine === 'chromium' && process.env.PROFILE_DEBUG ? { args: ['--enable-logging=stderr'] } : {}) };
const result = { engine, origin, profile, options, evidence: [], storageStateUsed: false };
for (let run = 0; run < 2; run++) {
  console.error(`Opening ${engine}, run ${run}, profile ${profile}`);
  const context = await type.launchPersistentContext(profile, options);
  try {
    const page = await context.newPage();
    await page.goto(origin, { waitUntil: 'networkidle' });
    if (!run) {
      await page.locator('[data-cookie-banner] [data-cookie-reject]').click();
      await page.evaluate(() => {
        document.cookie = 'audit_js_control=nonpersonal; Path=/; Max-Age=86400; SameSite=Lax';
        localStorage.setItem('audit_control', 'nonpersonal');
      });
      await context.addCookies([{ name: 'audit_protocol_control', value: 'nonpersonal', url: origin, expires: Date.now() / 1000 + 86400 }]);
      await page.waitForTimeout(2000);
    }
    result.evidence.push({ run, version: context.browser()?.version(), cookies: await context.cookies(), localStorage: await page.evaluate(() => ({ ...localStorage })), userAgent: await page.evaluate(() => navigator.userAgent) });
  } finally { console.error('Closing browser'); await context.close(); }
}
result.preserved = result.evidence[1].cookies.some(c => c.name === 'dipanda_consent');
console.log(JSON.stringify(result, null, 2));
