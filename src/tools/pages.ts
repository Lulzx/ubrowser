import { z } from 'zod';
import { browserManager } from '../browser/manager.js';
import { extractInteractiveElements } from '../snapshot/extractor.js';
import { filterElements } from '../snapshot/pruner.js';
import { formatSnapshot, clearSnapshotCache } from '../snapshot/formatter.js';
import { refManager } from '../refs/manager.js';
import type { ToolResponse } from '../types.js';

// Schema for page management tool
export const pagesSchema = z.object({
  action: z.enum(['list', 'create', 'switch', 'close']).describe('Action to perform'),
  name: z.string().optional().describe('Page name (required for create/switch/close)'),
  snapshot: z.object({
    include: z.boolean().optional(),
    format: z.enum(['compact', 'full', 'diff', 'minimal']).optional(),
  }).optional().describe('Include snapshot after switching'),
});

export type PagesInput = z.infer<typeof pagesSchema>;

interface PagesResult {
  ok: boolean;
  action: string;
  pages?: string[];
  currentPage?: string;
  created?: string;
  switched?: string;
  closed?: string;
  snapshot?: string;
  error?: string;
}

// Execute pages action
export async function executePages(input: PagesInput): Promise<PagesResult> {
  try {
    switch (input.action) {
      case 'list': {
        const pages = browserManager.listPages();
        const current = browserManager.getCurrentPageName();
        return {
          ok: true,
          action: 'list',
          pages,
          currentPage: current,
        };
      }

      case 'create': {
        if (!input.name) {
          return { ok: false, action: 'create', error: 'Page name required' };
        }
        // Clear refs when creating new page
        refManager.clear();
        clearSnapshotCache();

        const page = await browserManager.getPage(input.name);
        const result: PagesResult = {
          ok: true,
          action: 'create',
          created: input.name,
          currentPage: input.name,
        };

        if (input.snapshot?.include) {
          const url = page.url();
          const title = await page.title();
          const elements = await extractInteractiveElements(page);
          const refs = filterElements(elements);
          result.snapshot = formatSnapshot(refs, url, title, input.snapshot.format ?? 'compact');
        }

        return result;
      }

      case 'switch': {
        if (!input.name) {
          return { ok: false, action: 'switch', error: 'Page name required' };
        }
        // Clear refs when switching pages
        refManager.clear();
        clearSnapshotCache();

        const page = await browserManager.switchPage(input.name);
        const result: PagesResult = {
          ok: true,
          action: 'switch',
          switched: input.name,
          currentPage: input.name,
        };

        if (input.snapshot?.include) {
          const url = page.url();
          const title = await page.title();
          const elements = await extractInteractiveElements(page);
          const refs = filterElements(elements);
          result.snapshot = formatSnapshot(refs, url, title, input.snapshot.format ?? 'compact');
        }

        return result;
      }

      case 'close': {
        if (!input.name) {
          return { ok: false, action: 'close', error: 'Page name required' };
        }
        const closed = await browserManager.closePage(input.name);
        if (!closed) {
          return { ok: false, action: 'close', error: `Page '${input.name}' not found` };
        }
        return {
          ok: true,
          action: 'close',
          closed: input.name,
          currentPage: browserManager.getCurrentPageName(),
          pages: browserManager.listPages(),
        };
      }

      default:
        return { ok: false, action: input.action, error: 'Unknown action' };
    }
  } catch (error) {
    return {
      ok: false,
      action: input.action,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Tool definition for MCP
export const pagesTool = {
  name: 'browser_pages',
  description: `Manage named browser pages for multi-page workflows. Pages persist across tool calls.

Actions:
- list: Show all open pages and current page
- create: Create a new named page (or switch if exists)
- switch: Switch to an existing page
- close: Close a named page

Example: Open login in one page, dashboard in another:
{"action": "create", "name": "login"}
{"action": "create", "name": "dashboard"}
{"action": "switch", "name": "login"}`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      action: { type: 'string', enum: ['list', 'create', 'switch', 'close'], description: 'Action to perform' },
      name: { type: 'string', description: 'Page name (required for create/switch/close)' },
      snapshot: {
        type: 'object',
        properties: {
          include: { type: 'boolean' },
          format: { type: 'string', enum: ['compact', 'full', 'diff', 'minimal'] },
        },
      },
    },
    required: ['action'],
  },
};
