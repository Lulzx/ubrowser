const { spawn } = require('child_process');

function runSnapshot(label, extraEnv, maxElements) {
  return new Promise((resolve) => {
    const server = spawn('node', ['build/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...extraEnv },
    });

    let outputText = '';
    let cmdTimes = {};

    server.stdout.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.id >= 2 && cmdTimes[parsed.id] && parsed.id === 3) {
            outputText = parsed.result?.content?.[0]?.text || '';
          }
        } catch {}
      }
    });

    const initMsg = JSON.stringify({
      jsonrpc: '2.0', id: 1, method: 'initialize',
      params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'bench', version: '1.0.0' } }
    });
    server.stdin.write(initMsg + '\n');

    const buttons = Array.from({ length: 250 }, (_, i) => `<button id="b${i}">Button ${i}</button>`).join('');
    const inputs = Array.from({ length: 150 }, (_, i) => `<input id="i${i}" type="text" placeholder="Field ${i}">`).join('');
    const links = Array.from({ length: 100 }, (_, i) => `<a href="#l${i}">Link ${i}</a>`).join('');
    const html = encodeURIComponent(`<html><body>${buttons}${inputs}${links}</body></html>`);

    const navMsg = JSON.stringify({
      jsonrpc: '2.0', id: 2, method: 'tools/call',
      params: { name: 'browser_navigate', arguments: { url: 'data:text/html,' + html } }
    });
    const snapMsg = JSON.stringify({
      jsonrpc: '2.0', id: 3, method: 'tools/call',
      params: { name: 'browser_snapshot', arguments: maxElements ? { maxElements } : {} }
    });

    function send(msg, waitForResponse) {
      return new Promise((res) => {
        cmdTimes[msg.id] = Date.now();
        server.stdin.write(msg.payload + '\n');
        if (!waitForResponse) return res();
        const check = setInterval(() => {
          if (outputText) {
            clearInterval(check);
            res();
          }
        }, 25);
        setTimeout(() => {
          clearInterval(check);
          res();
        }, 5000);
      });
    }

    setTimeout(async () => {
      await send({ id: 2, payload: navMsg }, true);
      await send({ id: 3, payload: snapMsg }, true);
      server.kill();
      let snapshot = '';
      try {
        const parsed = JSON.parse(outputText);
        snapshot = parsed.snapshot || '';
      } catch {}
      const lines = snapshot.split('\n').filter(Boolean);
      const bodyLines = lines.slice(1);
      const bodyChars = bodyLines.join('\n').length;
      resolve({
        label,
        elements: bodyLines.length,
        chars: bodyChars,
      });
    }, 200);
  });
}

async function main() {
  console.log('═'.repeat(75));
  console.log('  🧱 DOM-HEAVY SNAPSHOT BENCHMARK');
  console.log('═'.repeat(75));
  console.log();

  const baseline = await runSnapshot('baseline', {}, undefined);
  const capped = await runSnapshot('maxElements=40', {}, 40);
  const envCapped = await runSnapshot('UBROWSER_MAX_ELEMENTS=40', { UBROWSER_MAX_ELEMENTS: '40' }, undefined);

  console.log('Snapshot output size:');
  console.log(`- ${baseline.label}: ${baseline.elements} elements, ${baseline.chars} chars`);
  console.log(`- ${capped.label}: ${capped.elements} elements, ${capped.chars} chars`);
  console.log(`- ${envCapped.label}: ${envCapped.elements} elements, ${envCapped.chars} chars`);
}

main().catch(console.error);
