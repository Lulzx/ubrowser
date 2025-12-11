const { spawn } = require('child_process');

// Token counting (approximate - using cl100k_base estimates)
function countTokens(str) {
  // Rough estimate: ~4 chars per token for English text
  // JSON/code is denser, ~3 chars per token
  return Math.ceil(str.length / 3.5);
}

// Cost calculation (Claude Opus 4.5 pricing)
const COST_PER_1M_INPUT = 15.00;  // $15 per 1M input tokens
const COST_PER_1M_OUTPUT = 75.00; // $75 per 1M output tokens

function calculateCost(inputTokens, outputTokens) {
  return (inputTokens / 1_000_000 * COST_PER_1M_INPUT) +
         (outputTokens / 1_000_000 * COST_PER_1M_OUTPUT);
}

async function runServer(commands, label) {
  return new Promise((resolve) => {
    const server = spawn('node', ['build/index.js'], { stdio: ['pipe', 'pipe', 'pipe'] });

    let responses = [];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let startTime = Date.now();
    let firstResponseTime = null;
    let lastResponseTime = null;

    server.stdout.on('data', (data) => {
      if (!firstResponseTime) firstResponseTime = Date.now();
      lastResponseTime = Date.now();

      const lines = data.toString().trim().split('\n');
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.id >= 2) {
            responses.push(parsed);
            totalOutputTokens += countTokens(line);
          }
        } catch (e) {}
      }
    });

    // Initialize
    const initMsg = JSON.stringify({
      jsonrpc: '2.0', id: 1, method: 'initialize',
      params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'bench', version: '1.0.0' } }
    });
    server.stdin.write(initMsg + '\n');
    totalInputTokens += countTokens(initMsg);

    let commandIndex = 0;
    const sendNext = () => {
      if (commandIndex < commands.length) {
        const cmd = commands[commandIndex];
        const msg = JSON.stringify({ jsonrpc: '2.0', id: commandIndex + 2, ...cmd });
        server.stdin.write(msg + '\n');
        totalInputTokens += countTokens(msg);
        commandIndex++;

        // Wait for response before sending next
        const checkResponse = setInterval(() => {
          if (responses.length >= commandIndex) {
            clearInterval(checkResponse);
            setTimeout(sendNext, 100);
          }
        }, 50);
      } else {
        // All commands sent, wait a bit then finish
        setTimeout(() => {
          server.kill();
          const totalTime = lastResponseTime - startTime;
          resolve({
            label,
            responses: responses.length,
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
            totalTokens: totalInputTokens + totalOutputTokens,
            timeMs: totalTime,
            cost: calculateCost(totalInputTokens, totalOutputTokens)
          });
        }, 500);
      }
    };

    setTimeout(sendNext, 300);
  });
}

async function main() {
  console.log('='.repeat(70));
  console.log('ULTRA-FAST BROWSER BENCHMARK: Playwright MCP vs μBrowser Approach');
  console.log('='.repeat(70));
  console.log('\nScenario: Navigate to site, interact with 3 elements, get final state\n');

  // Playwright MCP approach: 5 separate tool calls, each requesting snapshot
  const traditionalCommands = [
    { method: 'tools/call', params: { name: 'browser_navigate', arguments: { url: 'https://news.ycombinator.com', snapshot: { include: true } } } },
    { method: 'tools/call', params: { name: 'browser_snapshot', arguments: {} } },
    { method: 'tools/call', params: { name: 'browser_click', arguments: { ref: 'e3', snapshot: { include: true } } } },
    { method: 'tools/call', params: { name: 'browser_snapshot', arguments: {} } },
    { method: 'tools/call', params: { name: 'browser_scroll', arguments: { direction: 'down', amount: 300, snapshot: { include: true } } } },
  ];

  // μBrowser approach: 1 batch call, snapshot only at end
  const optimizedCommands = [
    { method: 'tools/call', params: { name: 'browser_batch', arguments: {
      steps: [
        { tool: 'navigate', args: { url: 'https://news.ycombinator.com' } },
        { tool: 'click', args: { selector: 'a[href="newest"]' } },
        { tool: 'scroll', args: { direction: 'down', amount: 300 } },
      ],
      snapshot: { when: 'final' }
    } } },
  ];

  console.log('Running Playwright MCP Approach (5 tool calls with snapshots)...');
  const traditional = await runServer(traditionalCommands, 'Playwright MCP');

  console.log('Running μBrowser Approach (1 batch call, final snapshot only)...');
  const optimized = await runServer(optimizedCommands, 'μBrowser');

  // Results
  console.log('\n' + '='.repeat(70));
  console.log('RESULTS');
  console.log('='.repeat(70));

  console.log('\n┌─────────────────────┬──────────────────┬──────────────────┬────────────┐');
  console.log('│ Metric              │ Playwright MCP      │ μBrowser        │ Savings    │');
  console.log('├─────────────────────┼──────────────────┼──────────────────┼────────────┤');

  const tokenSavings = ((traditional.totalTokens - optimized.totalTokens) / traditional.totalTokens * 100).toFixed(1);
  const timeSavings = ((traditional.timeMs - optimized.timeMs) / traditional.timeMs * 100).toFixed(1);
  const costSavings = ((traditional.cost - optimized.cost) / traditional.cost * 100).toFixed(1);

  console.log(`│ Tool Calls          │ ${String(traditional.responses).padStart(16)} │ ${String(optimized.responses).padStart(16)} │ ${(traditional.responses - optimized.responses)}x fewer   │`);
  console.log(`│ Input Tokens        │ ${String(traditional.inputTokens).padStart(16)} │ ${String(optimized.inputTokens).padStart(16)} │ ${tokenSavings}%      │`);
  console.log(`│ Output Tokens       │ ${String(traditional.outputTokens).padStart(16)} │ ${String(optimized.outputTokens).padStart(16)} │            │`);
  console.log(`│ Total Tokens        │ ${String(traditional.totalTokens).padStart(16)} │ ${String(optimized.totalTokens).padStart(16)} │ ${tokenSavings}%      │`);
  console.log(`│ Time (ms)           │ ${String(traditional.timeMs).padStart(16)} │ ${String(optimized.timeMs).padStart(16)} │ ${timeSavings}%      │`);
  console.log(`│ Est. Cost           │ $${traditional.cost.toFixed(6).padStart(14)} │ $${optimized.cost.toFixed(6).padStart(14)} │ ${costSavings}%      │`);
  console.log('└─────────────────────┴──────────────────┴──────────────────┴────────────┘');

  console.log('\n📊 SUMMARY:');
  console.log(`   • Token reduction: ${tokenSavings}%`);
  console.log(`   • Speed improvement: ${timeSavings}% faster`);
  console.log(`   • Cost savings: ${costSavings}%`);
  console.log(`   • Tool calls: ${traditional.responses} → ${optimized.responses} (${traditional.responses - optimized.responses}x reduction)`);

  // Extrapolate to realistic scenario
  console.log('\n📈 EXTRAPOLATED TO 100-INTERACTION SESSION:');
  const sessionsPlaywright MCP = traditional.totalTokens * 20; // 100 interactions ≈ 20 such flows
  const sessionsμBrowser = optimized.totalTokens * 20;
  const sessionCostTrad = calculateCost(sessionsPlaywright MCP * 0.7, sessionsPlaywright MCP * 0.3);
  const sessionCostOpt = calculateCost(sessionsμBrowser * 0.7, sessionsμBrowser * 0.3);

  console.log(`   Playwright MCP: ~${sessionsPlaywright MCP.toLocaleString()} tokens, ~$${sessionCostTrad.toFixed(2)}`);
  console.log(`   μBrowser:   ~${sessionsμBrowser.toLocaleString()} tokens, ~$${sessionCostOpt.toFixed(2)}`);
  console.log(`   Savings:     ~${(sessionsPlaywright MCP - sessionsμBrowser).toLocaleString()} tokens, ~$${(sessionCostTrad - sessionCostOpt).toFixed(2)}`);
}

main().catch(console.error);
