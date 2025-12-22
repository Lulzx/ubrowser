const { spawn } = require('child_process');

async function runBenchmark() {
  return new Promise((resolve) => {
    const server = spawn('node', ['build/index.js'], { stdio: ['pipe', 'pipe', 'pipe'] });

    let results = [];
    let cmdTimes = {};

    server.stdout.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.id >= 2 && cmdTimes[parsed.id]) {
            const elapsed = Date.now() - cmdTimes[parsed.id];
            const text = parsed.result && parsed.result.content && parsed.result.content[0] && parsed.result.content[0].text;
            const ok = text && (text.includes('"ok":true') || text.includes('"ok": true'));
            results.push({ id: parsed.id, time: elapsed, ok, text: text ? text.substring(0, 100) : '' });
            console.log('  [' + parsed.id + '] ' + elapsed + 'ms ' + (ok ? '✓' : '✗'));
            if (!ok && text) console.log('    Error: ' + text.substring(0, 200));
          }
        } catch (e) {}
      }
    });

    server.stderr.on('data', (data) => {
      if (data.toString().includes('started')) {
        console.log('Server ready\n');
      }
    });

    function send(msg, wait) {
      return new Promise((res) => {
        cmdTimes[msg.id] = Date.now();
        server.stdin.write(JSON.stringify(msg) + '\n');
        if (wait) {
          const check = setInterval(() => {
            if (results.find(r => r.id === msg.id)) {
              clearInterval(check);
              res();
            }
          }, 50);
          // Timeout after 15 seconds
          setTimeout(() => {
            clearInterval(check);
            res();
          }, 15000);
        } else {
          res();
        }
      });
    }

    // Initialize
    server.stdin.write(JSON.stringify({
      jsonrpc: '2.0', id: 1, method: 'initialize',
      params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'bench', version: '1.0.0' } }
    }) + '\n');

    setTimeout(async () => {
      console.log('=== μBrowser Speed Benchmark ===\n');

      // Test 1: Navigate to simple page
      console.log('1. Navigate (example.com):');
      await send({
        jsonrpc: '2.0', id: 2, method: 'tools/call',
        params: { name: 'browser_navigate', arguments: { url: 'https://example.com' } }
      }, true);

      // Test 2: Snapshot only
      console.log('\n2. Snapshot (pure DOM extraction):');
      await send({
        jsonrpc: '2.0', id: 3, method: 'tools/call',
        params: { name: 'browser_snapshot', arguments: {} }
      }, true);

      // Test 3: Click the link
      console.log('\n3. Click link:');
      await send({
        jsonrpc: '2.0', id: 4, method: 'tools/call',
        params: { name: 'browser_click', arguments: { selector: 'a' } }
      }, true);

      // Test 4: Batch - navigate to HN + scroll
      console.log('\n4. Batch (navigate + 2 scrolls + final snapshot):');
      await send({
        jsonrpc: '2.0', id: 5, method: 'tools/call',
        params: { name: 'browser_batch', arguments: {
          steps: [
            { tool: 'navigate', args: { url: 'https://news.ycombinator.com' } },
            { tool: 'scroll', args: { direction: 'down', amount: 200 } },
            { tool: 'scroll', args: { direction: 'down', amount: 200 } },
          ],
          snapshot: { when: 'final' }
        }}
      }, true);

      // Test 5: Snapshot on complex page (HN)
      console.log('\n5. Snapshot (complex page - HN):');
      await send({
        jsonrpc: '2.0', id: 6, method: 'tools/call',
        params: { name: 'browser_snapshot', arguments: {} }
      }, true);

      // Test 6: Type using a data: URL form (no network)
      console.log('\n6. Navigate to local form (data URL):');
      const formHtml = encodeURIComponent('<html><body><form><input name="test" type="text" /><button>Submit</button></form></body></html>');
      await send({
        jsonrpc: '2.0', id: 7, method: 'tools/call',
        params: { name: 'browser_navigate', arguments: { url: 'data:text/html,' + formHtml } }
      }, true);

      console.log('\n7. Type into input:');
      await send({
        jsonrpc: '2.0', id: 8, method: 'tools/call',
        params: { name: 'browser_type', arguments: { selector: 'input[name="test"]', text: 'Hello World' } }
      }, true);

      // Summary
      server.kill();
      console.log('\n' + '='.repeat(50));
      console.log('RESULTS');
      console.log('='.repeat(50));

      let total = 0;
      results.forEach(r => { total += r.time; });
      console.log('\nTotal time: ' + total + 'ms for ' + results.length + ' operations');
      console.log('Average: ' + Math.round(total / results.length) + 'ms/op');

      console.log('\nBreakdown:');
      const snap1 = results.find(r => r.id === 3);
      const snap2 = results.find(r => r.id === 6);
      const click = results.find(r => r.id === 4);
      const type = results.find(r => r.id === 8);
      const batch = results.find(r => r.id === 5);
      const nav = results.find(r => r.id === 2);

      console.log('  Navigate (example.com):    ' + (nav ? nav.time : 'N/A') + 'ms');
      console.log('  Snapshot (simple page):    ' + (snap1 ? snap1.time : 'N/A') + 'ms');
      console.log('  Snapshot (complex HN):     ' + (snap2 ? snap2.time : 'N/A') + 'ms');
      console.log('  Click (+ wait for nav):    ' + (click ? click.time : 'N/A') + 'ms');
      console.log('  Type:                      ' + (type ? type.time : 'N/A') + 'ms');
      console.log('  Batch (nav+2scroll+snap):  ' + (batch ? batch.time : 'N/A') + 'ms');

      console.log('\n✨ Key wins:');
      if (snap1 && snap1.ok) console.log('   • DOM extraction: ' + snap1.time + 'ms (was ~50-100ms before optimization)');
      if (batch && batch.ok) console.log('   • Batch efficiency: 3 ops + snapshot in single call');

      resolve();
    }, 1000);
  });
}

runBenchmark().catch(console.error);
