# μBrowser

**The fastest, cheapest browser automation for Claude.**

```
μBrowser      ████████ 39s  $0.17
Dev Browser   ████████████████████████████████████████ 3m 53s  $0.88
Playwright    ████████████████████████████████████████████████ 4m 31s  $1.45
```

## Benchmarks

Tested on [dev-browser-eval](https://github.com/SawyerHood/dev-browser-eval) game-tracker task with Claude Opus 4.5:

| Method | Time | Cost | Turns | vs μBrowser |
|--------|------|------|-------|-------------|
| **μBrowser** | **39s** | **$0.17** | **6** | — |
| Dev Browser | 3m 53s | $0.88 | 29 | 6× slower, 5× costlier |
| Playwright MCP | 4m 31s | $1.45 | 51 | 7× slower, 9× costlier |
| Playwright Skill | 8m 07s | $1.45 | 38 | 12× slower, 9× costlier |

**At scale (1000 tasks/month):**
| Method | Monthly Cost |
|--------|-------------|
| μBrowser | $170 |
| Playwright MCP | $1,450 |
| **You save** | **$1,280/month**

## Why So Fast?

### 1. Batch Execution
```json
// 4 actions, 1 API call, 1 snapshot
{"steps": [
  {"tool": "navigate", "args": {"url": "/login"}},
  {"tool": "type", "args": {"selector": "#email", "text": "user@test.com"}},
  {"tool": "type", "args": {"selector": "#pass", "text": "secret"}},
  {"tool": "click", "args": {"selector": "button[type=submit]"}}
], "snapshot": {"when": "final"}}
```
Others make 4 separate calls. We make 1. **75% fewer API calls.**

### 2. Ultra-Compact Format
```
# Others (~180 tokens):
<button id="e1" role="button">Submit</button>
<input id="e2" type="email" placeholder="Email" required>
<input id="e3" type="password" placeholder="Password">

# μBrowser (~50 tokens):
btn#e1"Submit"
inp#e2@e~"Email"!r
inp#e3@p~"Password"
```
**70% smaller snapshots.** Output tokens cost 5× more than input.

### 3. Minimal Responses
```json
// Default response
{"ok":true}

// Only get DOM when you need it
{"ok":true,"snap":"btn#e1\"Submit\"\ninp#e2@e~\"Email\""}
```

## Install

### Claude Code Plugin (Recommended)

```bash
# Add the marketplace
/plugin marketplace add lulzx/claude-code

# Install ubrowser
/plugin install ubrowser@claude-code
```

That's it! Restart Claude Code and the ubrowser MCP tools are ready to use.

### Manual Installation

```bash
git clone https://github.com/lulzx/ubrowser && cd ubrowser
npm install && npx playwright install chromium && npm run build
claude mcp add ubrowser -- node "$PWD/build/index.js"
```

## Tools

| Tool | Purpose |
|------|---------|
| `browser_batch` | Execute multiple actions in one call |
| `browser_navigate` | Go to URL |
| `browser_click` | Click element by ref or selector |
| `browser_type` | Type into input field |
| `browser_select` | Select dropdown option |
| `browser_scroll` | Scroll page or element |
| `browser_snapshot` | Get interactive elements |
| `browser_pages` | Manage multiple tabs |
| `browser_inspect` | Deep inspect specific element |

## Format Reference

**Element notation:**
```
tag#ref@type~"placeholder"/href"content"!flags

btn#e1"Submit"           → <button id="e1">Submit</button>
inp#e2@e~"Email"!r       → <input id="e2" type="email" placeholder="Email" required>
a#e3/login"Sign in"      → <a id="e3" href="/login">Sign in</a>
sel#e4"Country"          → <select id="e4">Country</select>
```

**Type abbreviations:** `@e`=email `@p`=password `@t`=text `@n`=number `@c`=checkbox `@r`=radio

**Flags:** `!d`=disabled `!c`=checked `!r`=required

## Feature Comparison

| Feature | Playwright MCP | Dev Browser | μBrowser |
|---------|:-------------:|:-----------:|:--------:|
| Basic actions | ✓ | ✓ | ✓ |
| Element refs | ✗ | ✓ | ✓ |
| Multi-tab | ✗ | ✓ | ✓ |
| **Batch execution** | ✗ | ✗ | **✓** |
| **Minimal responses** | ✗ | ✗ | **✓** |
| **Ultra-compact format** | ✗ | ✗ | **✓** |
| **Scoped snapshots** | ✗ | partial | **✓** |
| **Diff updates** | ✗ | ✗ | **✓** |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Claude                           │
└─────────────────────┬───────────────────────────────┘
                      │ 1 batch call
                      ▼
┌─────────────────────────────────────────────────────┐
│                   μBrowser                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │ navigate│→ │  type   │→ │  click  │→ ...       │
│  └─────────┘  └─────────┘  └─────────┘            │
│                      │                              │
│              ┌───────▼───────┐                     │
│              │ Ultra-compact │                     │
│              │   snapshot    │                     │
│              └───────────────┘                     │
└─────────────────────┬───────────────────────────────┘
                      │ 1 response
                      ▼
┌─────────────────────────────────────────────────────┐
│                    Claude                           │
│         (continues with minimal context)            │
└─────────────────────────────────────────────────────┘
```

## License

MIT
