import { createContactHandler } from '../scripts/contact-handler.mjs';
import { runtimeIsPatched } from '../scripts/runtime-version.mjs';
import { securityHeaders } from '../scripts/security.mjs';

// Web Request/Response signature supported by Vercel's Node.js runtime.
const handle = createContactHandler();
export default {
  fetch(request) {
    if (!runtimeIsPatched()) return new Response(JSON.stringify({ message: 'O formulário está temporariamente indisponível.' }), { status: 503, headers: { ...securityHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    // Trust this header only in the Vercel entrypoint; it is overwritten by Vercel.
    const ip = process.env.VERCEL === '1' ? request.headers.get('x-vercel-forwarded-for') : null;
    return handle(request, ip);
  },
};
