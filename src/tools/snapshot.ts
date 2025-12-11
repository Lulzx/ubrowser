import { z } from 'zod';
import { browserManager } from '../browser/manager.js';
import { extractInteractiveElements } from '../snapshot/extractor.js';
import { filterElements } from '../snapshot/pruner.js';
import { formatSnapshot } from '../snapshot/formatter.js';
import { cleanError, type ToolResponse } from '../types.js';

// Schema for snapshot tool
export const snapshotSchema = z.object({
  scope: z.string().optional().describe('CSS selector to scope the snapshot'),
  format: z.enum(['compact', 'full', 'diff', 'minimal']).optional().describe('Snapshot format (default: compact)'),
  maxElements: z.number().optional().describe('Maximum number of elements to return'),
});

export type SnapshotInput = z.infer<typeof snapshotSchema>;

// Execute snapshot
export async function executeSnapshot(input: SnapshotInput): Promise<ToolResponse> {
  const page = await browserManager.getPage();

  try {
    const url = page.url();
    const title = await page.title();

    // Extract interactive elements
    const elements = await extractInteractiveElements(page, input.scope);
    const refs = filterElements(elements, { maxElements: input.maxElements });

    // Format the snapshot
    const snapshot = formatSnapshot(
      refs,
      url,
      title,
      input.format ?? 'compact'
    );

    return {
      ok: true,
      snapshot,
      url,
      title,
    };
  } catch (error) {
    return {
      ok: false,
      error: cleanError(error),
    };
  }
}

// Tool definition for MCP
export const snapshotTool = {
  name: 'browser_snapshot',
  description: `Get a snapshot of interactive elements on the current page. Returns elements with refs (e1, e2, etc.) that can be used with other tools.

COMPACT FORMAT (default):
Uses ultra-compact notation: tag#ref@type~"placeholder"/href"text"!flags

Reading the format:
- tag#ref = HTML tag and element reference (e.g., btn#e1 = button with ref e1)
- @type = input type (@e=email, @p=password, @t=text, @n=number, @c=checkbox, @r=radio)
- ~"..." = placeholder text
- /... = href (for links)
- "..." = visible text content
- !flags = element state (!d=disabled, !c=checked, !r=required)

Examples:
  btn#e1"Submit"           → <button>Submit</button>, use ref "e1" to click
  inp#e2@e~"Email"!r       → <input type="email" placeholder="Email" required>
  a#e3/login"Sign in"      → <a href="/login">Sign in</a>
  inp#e4@c!c               → <input type="checkbox" checked>
  sel#e5"Country"          → <select> dropdown labeled "Country"`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      scope: { type: 'string', description: 'CSS selector to scope the snapshot' },
      format: { type: 'string', enum: ['compact', 'full', 'diff', 'minimal'], description: 'Snapshot format (default: compact)' },
      maxElements: { type: 'number', description: 'Maximum number of elements to return' },
    },
    required: [],
  },
};
