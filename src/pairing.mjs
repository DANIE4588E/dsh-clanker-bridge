import { writeFile } from 'node:fs/promises';
import { networkInterfaces } from 'node:os';
import path from 'node:path';

const escape = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function pairingHtml(port, token, interfaces = networkInterfaces()) {
  const addresses = Object.entries(interfaces).flatMap(([name, entries]) => (entries ?? [])
    .filter((a) => a.family === 'IPv4' && !a.internal && !a.address.startsWith('169.254.'))
    .map((a) => ({ name, url: `http://${a.address}:${port}` })));
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="no-referrer"><title>Pair Clanker</title>
<style>:root{color-scheme:light dark;font:16px/1.55 system-ui,sans-serif}body{max-width:600px;margin:48px auto;padding:0 24px}h1{font-size:28px;letter-spacing:-.6px;margin-bottom:8px}h2{font-size:17px;margin-top:28px}p{margin:8px 0 16px}label{display:block;margin-top:16px;font-size:14px}input{box-sizing:border-box;width:100%;padding:10px 12px;font:14px/1.5 ui-monospace,monospace;border:1px solid #8886;border-radius:6px;background:transparent;color:inherit}button{margin-top:8px;padding:7px 12px;font:inherit;border:1px solid #8886;border-radius:6px;cursor:pointer}small{opacity:.72}li{margin:8px 0}.note{margin-top:32px;border-top:1px solid #8884;padding-top:16px;font-size:14px}</style>
<h1>Pair Clanker with this PC</h1><p>In Clanker, open <strong>Settings → Backends → Add remote backend</strong>.</p>
<label>Connection name<input readonly value="Harness Desktop"></label>
${addresses.map((a, i) => `<label>Address · ${escape(a.name)}<input id="address${i}" readonly value="${escape(a.url)}"></label><button type="button" data-copy="address${i}">Copy address</button>`).join('') || '<p>No LAN address was found. Connect this PC to your network, then restart Harness to refresh these instructions.</p>'}
<label>Bridge token<input id="token" readonly value="${escape(token)}" autocomplete="off" spellcheck="false"></label><button type="button" data-copy="token">Copy token</button><p id="status" aria-live="polite"></p>
<h2>Finish on your phone</h2><ol><li>Enter a name, the PC’s Wi-Fi/Ethernet address, and the bridge token.</li><li>Tap <strong>Test connection</strong>, choose a model, and <strong>Save</strong>.</li><li>Start a new chat and select the saved backend.</li></ol>
<p class="note">Keep Harness running. Open it normally next time; the saved connection stays the same. Your phone needs a route to this PC through the same LAN or a private VPN. Use an HTTPS reverse proxy for internet access. Keep this file and token private.</p>
<script>for(const b of document.querySelectorAll('[data-copy]'))b.addEventListener('click',async()=>{const input=document.getElementById(b.dataset.copy);try{await navigator.clipboard.writeText(input.value);document.getElementById('status').textContent='Copied.'}catch{input.select();document.getElementById('status').textContent='Press Ctrl+C to copy the selected text.'}});</script></html>`;
}

/** Pairing is a private local file, never an unauthenticated HTTP endpoint. */
export async function writePairingPage(directory, port, token) {
  const file = path.join(directory, 'pairing.html');
  await writeFile(file, pairingHtml(port, token), { mode: 0o600 });
  return file;
}
