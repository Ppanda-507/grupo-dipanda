import test from 'node:test';
import assert from 'node:assert/strict';
import { pages, renderPage } from '../src/pages.mjs';

const pagesWithoutForm = ['/termos-e-condicoes', '/politica-de-privacidade', '/politica-de-cookies', '/404'];
const contactLinks = html => [...html.matchAll(/<a\b[^>]*\bhref="([^"]*contacto[^"]*)"/g)].map(match => match[1]);

test('contact CTAs, navigation and footer use the form on the current page', () => {
  for (const route of Object.keys(pages).filter(route => !pagesWithoutForm.includes(route))) {
    const html = renderPage(route);
    assert.match(html, /id="contacto"/, route);
    assert.match(html, /data-contact-form/, route);
    const links = contactLinks(html);
    assert.ok(links.length >= 3, `${route}: desktop, mobile and footer contact links`);
    assert.ok(links.every(href => href === '#contacto'), `${route}: contact links must stay on this page`);
  }
});

test('pages without a form link directly to the contact page', () => {
  for (const route of pagesWithoutForm) {
    const html = renderPage(route);
    assert.doesNotMatch(html, /data-contact-form/, route);
    const links = contactLinks(html);
    assert.ok(links.length >= 3, route);
    assert.ok(links.every(href => href === '/contacto/'), `${route}: no home detour or missing local anchor`);
  }
});
