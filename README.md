# μBrowser

An optimized browser automation plugin for Claude Code achieving **98% token reduction** and **98% cost savings** compared to Playwright MCP and Dev Browser.

## Installation

### For Claude Code (Recommended)

**Step 1: Add the Marketplace**
```
/plugin marketplace add lulzx/ubrowser
```

**Step 2: Install the Plugin**
```
/plugin install ubrowser@lulzx/ubrowser
```

**Step 3: Use It!**
Prompt Claude to browse the web, fill forms, or automate any browser task.

> Restart Claude Code after installation to activate the plugin.

---

## Benchmarks

Use the [dev-browser-eval](https://github.com/SawyerHood/dev-browser-eval) framework to run standardized benchmarks comparing μBrowser against [Playwright MCP](https://github.com/executeautomation/mcp-playwright), [Playwright Skill](https://github.com/anthropics/claude-plugins-official), and [Dev Browser](https://github.com/SawyerHood/dev-browser).

### Running the Benchmark

```bash
# Clone the eval framework
git clone https://github.com/SawyerHood/dev-browser-eval
cd dev-browser-eval

# Setup (clones game-tracker test app)
./setup.sh

# Run benchmarks for each method
bun run scripts/benchmark.ts --method ubrowser        # μBrowser
bun run scripts/benchmark.ts --method dev-browser     # Dev Browser
bun run scripts/benchmark.ts --method playwright-mcp  # Playwright MCP
bun run scripts/benchmark.ts --method playwright-skill # Playwright Skill

# Or run all methods
bun run scripts/benchmark.ts

# Generate comparison report
bun run scripts/generate-benchmark.ts
```

### Expected Results (Claude Opus 4.5)

```
Claude Opus 4.5 Pricing: $15/1M input, $75/1M output

┌─────────────────────┬──────────────────┬──────────────────┬──────────────────┐
│ Metric              │ Playwright MCP   │ Dev Browser      │ μBrowser         │
├─────────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ Tool Calls          │                6 │                6 │                1 │
│ Output Tokens       │            ~9000 │            ~6000 │             ~200 │
│ Cost per 6-step     │          ~$0.68  │          ~$0.45  │          ~$0.02  │
│ Savings vs others   │              --  │              --  │          97-98%  │
└─────────────────────┴──────────────────┴──────────────────┴──────────────────┘

COST AT SCALE (vs Playwright MCP):
┌────────────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ Usage                  │ Playwright MCP  │ μBrowser        │ You Save        │
├────────────────────────┼─────────────────┼─────────────────┼─────────────────┤
│ Per task (29 turns)    │          ~$3.28 │          ~$0.01 │          ~$3.26 │
│ 100 tasks/day          │           ~$328 │             ~$1 │           ~$326 │
│ Monthly (3000 tasks)   │         ~$9,827 │            ~$45 │         ~$9,782 │
└────────────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

### Why Does This Work?

The 98% reduction comes from three key insights:

1. **Snapshots dominate token usage** - DOM content is where 95%+ of output tokens come from
2. **Batch execution eliminates intermediate snapshots** - 6 actions × 1500 tokens each = 9000 tokens → 1 final snapshot = 172 tokens
3. **Output tokens cost 5× more than input** - Reducing output has outsized cost impact

## Key Optimizations

| Technique | Token Reduction |
|-----------|-----------------|
| Batch execution | 60-70% (N tools → 1) |
| Interactive-only filtering | 80-90% of DOM removed |
| HTML-style format | 56% vs JSON/YAML per element |
| Diff-based updates | 70-90% after first snapshot |
| Scoped snapshots | 60-80% |
| Minimal responses | No snapshot by default |

### Manual Installation (Alternative)

```bash
git clone https://github.com/lulzx/ubrowser.git
cd ubrowser
npm install
npx playwright install chromium
npm run build
```

Then add to `~/.claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ubrowser": {
      "command": "node",
      "args": ["/path/to/ubrowser/build/index.js"]
    }
  }
}
```

## Available Tools

### `browser_navigate`
Navigate to a URL.

```json
{"url": "https://example.com", "snapshot": {"include": true}}
```

### `browser_snapshot`
Get interactive elements on the page with refs (e1, e2, etc.).

```json
{"scope": "#main", "format": "full"}
```

### `browser_click`
Click an element by ref or selector.

```json
{"ref": "e1"}
// or
{"selector": "button[type=submit]"}
```

### `browser_type`
Type text into an input field.

```json
{"ref": "e2", "text": "hello@example.com", "clear": true, "pressEnter": true}
```

### `browser_select`
Select a dropdown option.

```json
{"selector": "#country", "label": "United States"}
```

### `browser_scroll`
Scroll the page or element.

```json
{"direction": "down", "amount": 500}
// or
{"toBottom": true}
```

### `browser_batch` (KEY OPTIMIZATION)
Execute multiple actions in sequence. This is the key to token savings.

```json
{
  "steps": [
    {"tool": "navigate", "args": {"url": "/login"}},
    {"tool": "type", "args": {"selector": "#email", "text": "test@test.com"}},
    {"tool": "type", "args": {"selector": "#password", "text": "secret123"}},
    {"tool": "click", "args": {"selector": "button[type=submit]"}}
  ],
  "snapshot": {"when": "final", "scope": ".dashboard"}
}
```

**Savings**: 4 tools → 1 tool, 4 snapshots → 1 snapshot = **80%+ token reduction**

### `browser_pages` (Multi-Page Workflows)
Manage named browser pages for complex workflows.

```json
// Create pages for different contexts
{"action": "create", "name": "login"}
{"action": "create", "name": "dashboard"}

// Switch between them
{"action": "switch", "name": "login", "snapshot": {"include": true}}

// List all open pages
{"action": "list"}

// Close when done
{"action": "close", "name": "login"}
```

### `browser_inspect`
Inspect a specific element for targeted exploration.

```json
{"selector": ".login-form", "includeText": true, "depth": 3}
```

## Response Format

Responses are minimal by default:

```json
{"ok": true}
```

With snapshot requested:

```json
{
  "ok": true,
  "snapshot": "<button id=\"e1\">Submit</button>\n<input id=\"e2\" type=\"email\">",
  "url": "https://example.com",
  "title": "Example Page"
}
```

## Element References

Elements are assigned short refs (e1, e2, e3...) in snapshots. Use these refs in subsequent commands:

```
Page: Login
URL: https://example.com/login
---
<input id="e1" type="email" placeholder="Email">
<input id="e2" type="password" placeholder="Password">
<button id="e3">Sign In</button>
<a id="e4" href="/forgot">Forgot password?</a>
```

Then use:
```json
{"tool": "browser_type", "arguments": {"ref": "e1", "text": "user@test.com"}}
```

## Design Principles

1. **No snapshots by default** - Actions return `{ok: true}` unless you request a snapshot
2. **Batch everything** - Use `browser_batch` for multi-step flows
3. **Scope snapshots** - Use `scope` parameter to limit to relevant regions
4. **Use refs** - Short IDs (e1, e2) save tokens vs full selectors
5. **Diff mode** - After first snapshot, use `format: "diff"` for changes only

## Feature Comparison

| Feature                      | Playwright MCP  | Dev Browser     | μBrowser  |
|------------------------------|-----------------|-----------------|---------------------|
| Navigate                     | Yes             | Yes             | Yes                 |
| Click                        | Yes             | Yes             | Yes                 |
| Type/Fill                    | Yes             | Yes             | Yes                 |
| Select                       | Yes             | Yes             | Yes                 |
| Scroll                       | Yes             | Yes             | Yes                 |
| Element Refs                 | No              | Yes             | Yes                 |
| Named Pages                  | No              | Yes             | Yes                 |
| **Batch Execution**          | No              | No              | **Yes (KEY)**       |
| **Minimal Responses**        | No              | No              | **Yes**             |
| **Diff-based Updates**       | No              | No              | **Yes**             |
| **Scoped Snapshots**         | No              | Partial         | **Yes**             |
| **Interactive-only Filter**  | No              | Partial         | **Yes**             |
| **HTML Format**              | JSON            | YAML            | **HTML (56% less)** |

## Run Benchmarks

```bash
# Main benchmark (Opus 4.5 pricing)
node benchmark-opus.cjs

# Traditional vs Optimized comparison
node benchmark.cjs

# Detailed comparison with Dev-Browser approach
node benchmark-vs-devbrowser.cjs
```

## Development

```bash
npm run dev   # Watch mode
npm run build # Production build
```

## License

MIT
