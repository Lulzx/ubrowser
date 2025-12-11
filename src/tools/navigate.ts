import { z } from 'zod';
import { browserManager } from '../browser/manager.js';
import { refManager } from '../refs/manager.js';
import { extractInteractiveElements } from '../snapshot/extractor.js';
import { filterElements } from '../snapshot/pruner.js';
import { formatSnapshot, clearSnapshotCache } from '../snapshot/formatter.js';
import type { ToolResponse, SnapshotOptions } from '../types.js';

// Schema for navigate tool
export const navigateSchema = z.object({
  url: z.string().describe('URL to navigate to'),
  waitUntil: z.enum(['load', 'domcontentloaded', 'networkidle']).optional()
    .describe('Wait condition (default: domcontentloaded)'),
  snapshot: z.object({
    include: z.boolean().optional().describe('Include snapshot in response'),
    scope: z.string().optional().describe('CSS selector to scope snapshot'),
    format: z.enum(['compact', 'full', 'diff', 'minimal']).optional().describe('Snapshot format'),
  }).optional().describe('Snapshot options'),
  timeout: z.number().optional().describe('Timeout in ms (default: 30000)'),
});

export type NavigateInput = z.infer<typeof navigateSchema>;

// Execute navigate
export async function executeNavigate(input: NavigateInput): Promise<ToolResponse> {
  const page = await browserManager.getPage();
  const timeout = input.timeout ?? 30000;

  try {
    // Clear refs and snapshot cache on navigation
    refManager.clear();
    clearSnapshotCache();

    // Navigate
    await page.goto(input.url, {
      waitUntil: input.waitUntil ?? 'domcontentloaded',
      timeout,
    });

    const url = page.url();
    const title = await page.title();

    // Build response
    const response: ToolResponse = {
      ok: true,
      url,
      title,
    };

    // Include snapshot if requested
    if (input.snapshot?.include) {
      const elements = await extractInteractiveElements(page, input.snapshot.scope);
      const refs = filterElements(elements);
      response.snapshot = formatSnapshot(
        refs,
        url,
        title,
        input.snapshot.format ?? 'compact'
      );
    }

    return response;
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Tool definition for MCP
export const navigateTool = {
  name: 'browser_navigate',
  description: 'Navigate to a URL. Returns page title and URL. Optionally include a snapshot of interactive elements.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      url: { type: 'string', description: 'URL to navigate to' },
      waitUntil: {
        type: 'string',
        enum: ['load', 'domcontentloaded', 'networkidle'],
        description: 'Wait condition (default: domcontentloaded)',
      },
      snapshot: {
        type: 'object',
        properties: {
          include: { type: 'boolean', description: 'Include snapshot in response' },
          scope: { type: 'string', description: 'CSS selector to scope snapshot' },
          format: { type: 'string', enum: ['compact', 'full', 'diff', 'minimal'], description: 'Snapshot format' },
        },
        description: 'Snapshot options',
      },
      timeout: { type: 'number', description: 'Timeout in ms (default: 30000)' },
    },
    required: ['url'],
  },
};
