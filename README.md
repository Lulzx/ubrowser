# μBrowser

Ultra-fast browser automation for Claude. **55% faster**, **66% cheaper** than alternatives.

## Benchmarks

Real-world results on [dev-browser-eval](https://github.com/SawyerHood/dev-browser-eval) game-tracker task (Claude Opus 4.5):

| Method | Time | Cost | Turns | Savings |
|--------|------|------|-------|---------|
| **μBrowser** | **1m 45s** | **$0.49** | **20** | — |
| Dev Browser | 3m 53s | $0.88 | 29 | 55% slower, 45% more |
| Playwright MCP | 4m 31s | $1.45 | 51 | 61% slower, 66% more |
| Playwright Skill | 8m 07s | $1.45 | 38 | 78% slower, 66% more |

### Why So Fast?

1. **Batch execution** — Multi-step flows in one call (4 tools → 1)
2. **Ultra-compact format** — `btn#e1"Submit"` instead of verbose JSON
3. **No intermediate snapshots** — Only return DOM when needed
4. **Output tokens cost 5×** — Reducing output has outsized cost impact

## Install

```bash
# Claude Code plugin
/plugin marketplace add lulzx/ubrowser
/plugin install ubrowser@lulzx/ubrowser
```

Or manual:
```bash
git clone https://github.com/lulzx/ubrowser && cd ubrowser
npm install && npx playwright install chromium && npm run build
```

Add to `~/.claude/claude_desktop_config.json`:
```json
{"mcpServers": {"ubrowser": {"command": "node", "args": ["/path/to/ubrowser/build/index.js"]}}}
```

## Tools

### `browser_batch` — The Key Optimization
```json
{"steps": [
  {"tool": "navigate", "args": {"url": "/login"}},
  {"tool": "type", "args": {"selector": "#email", "text": "test@test.com"}},
  {"tool": "type", "args": {"selector": "#password", "text": "secret"}},
  {"tool": "click", "args": {"selector": "button[type=submit]"}}
], "snapshot": {"when": "final"}}
```
4 actions, 1 call, 1 snapshot → **80%+ token reduction**

### `browser_navigate`
```json
{"url": "https://example.com", "snapshot": {"include": true}}
```

### `browser_click` / `browser_type` / `browser_select`
```json
{"ref": "e1"}
{"ref": "e2", "text": "hello@example.com"}
{"selector": "#country", "label": "United States"}
```

### `browser_scroll`
```json
{"direction": "down", "amount": 500}
{"toBottom": true}
```

### `browser_snapshot`
```json
{"scope": "#main", "format": "compact"}
```

Returns ultra-compact format:
```
[Login](example.com/login)
inp#e1@e~"Email"
inp#e2@p~"Password"
btn#e3"Sign In"
a#e4/forgot"Forgot password?"
```

### `browser_pages` — Multi-Page Workflows
```json
{"action": "create", "name": "tab1"}
{"action": "switch", "name": "tab1"}
{"action": "list"}
{"action": "close", "name": "tab1"}
```

## Output Format

Default (minimal):
```json
{"ok":true}
```

With snapshot:
```json
{"ok":true,"snap":"btn#e1\"Submit\"\ninp#e2@e~\"Email\""}
```

Batch error:
```json
{"ok":false,"err":"Element not found","at":2,"n":2}
```

## Key Optimizations

| Technique | Savings |
|-----------|---------|
| Batch execution | 60-70% |
| Ultra-compact format | 70%+ vs HTML |
| Interactive-only filter | 80-90% of DOM |
| Scoped snapshots | 60-80% |
| Diff-based updates | 70-90% |

## License

MIT
