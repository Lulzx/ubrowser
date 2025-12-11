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

## How It Works

### 1. Batch Execution

Combine 25+ browser actions into a single API call:

```json
{"steps": [
  {"tool": "navigate", "args": {"url": "/login"}},
  {"tool": "type", "args": {"selector": "#email", "text": "user@test.com"}},
  {"tool": "type", "args": {"selector": "#pass", "text": "secret"}},
  {"tool": "click", "args": {"selector": "button[type=submit]"}}
], "snapshot": {"when": "final"}}
```

Others make 4 separate calls. We make 1. **75% fewer API calls.**

### 2. Ultra-Compact Snapshot Format

Standard HTML (~180 tokens):
```html
<button id="e1" role="button">Submit</button>
<input id="e2" type="email" placeholder="Email" required>
<input id="e3" type="password" placeholder="Password">
```

μBrowser (~50 tokens):
```
btn#e1"Submit"
inp#e2@e~"Email"!r
inp#e3@p~"Password"
```

**70% smaller snapshots.** Output tokens cost 5× more than input.

### 3. Minimal Responses

```json
{"ok":true}
{"ok":true,"snap":"btn#e1\"Submit\"\ninp#e2@e~\"Email\""}
```

Only return DOM when explicitly requested.

## Implementation Details

**Fast DOM extraction** — Single `querySelectorAll` with compound selector instead of recursive tree walk. Extracts 100+ elements in ~5ms.

**Resource blocking** — Images, fonts, media blocked at network level via Playwright route interception. Stylesheets preserved for layout accuracy.

**Parallel snapshot** — `Promise.all` fetches URL, title, and DOM elements concurrently during batch finalization.

**Playwright auto-wait** — Leverages built-in actionability checks instead of manual waits. 5s timeout vs 30s default.

**Single-op type** — Uses `fill()` for instant text input when no delay/enter needed, bypassing character-by-character simulation.

## Install

### Claude Code Plugin (Recommended)

```bash
/plugin marketplace add lulzx/claude-code
/plugin install ubrowser@claude-code
```

Restart Claude Code and the ubrowser MCP tools are ready.

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

```
tag#ref@type~"placeholder"/href"content"!flags

btn#e1"Submit"           → <button>Submit</button>
inp#e2@e~"Email"!r       → <input type="email" placeholder="Email" required>
a#e3/login"Sign in"      → <a href="/login">Sign in</a>
sel#e4"Country"          → <select>Country</select>
```

**Types:** `@e`=email `@p`=password `@t`=text `@n`=number `@c`=checkbox `@r`=radio

**Flags:** `!d`=disabled `!c`=checked `!r`=required

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Claude                               │
└─────────────────────────────┬───────────────────────────────┘
                              │ 1 batch call (25+ steps)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        μBrowser                              │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Batch Executor (sequential)              │   │
│  │  navigate → type → type → click → navigate → ...     │   │
│  └──────────────────────────┬───────────────────────────┘   │
│                             │                                │
│  ┌──────────────────────────▼───────────────────────────┐   │
│  │            Snapshot Engine (parallel)                 │   │
│  │  ┌─────────┐  ┌─────────┐  ┌──────────────────────┐  │   │
│  │  │ URL     │  │ Title   │  │ querySelectorAll     │  │   │
│  │  │ fetch   │  │ fetch   │  │ (compound selector)  │  │   │
│  │  └────┬────┘  └────┬────┘  └──────────┬───────────┘  │   │
│  │       └────────────┼──────────────────┘              │   │
│  │                    ▼                                  │   │
│  │           Ultra-compact formatter                     │   │
│  │           btn#e1"Submit"\ninp#e2@e~"Email"           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────┬───────────────────────────────┘
                              │ 1 response (~50 tokens)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         Claude                               │
│              (continues with minimal context)                │
└─────────────────────────────────────────────────────────────┘
```

## License

MIT
