import { z } from 'zod';
import { browserManager } from '../browser/manager.js';
import { refManager } from '../refs/manager.js';
import { extractInteractiveElements } from '../snapshot/extractor.js';
import { filterElements } from '../snapshot/pruner.js';
import { formatSnapshot } from '../snapshot/formatter.js';
import type { ToolResponse } from '../types.js';

// Schema for scroll tool
export const scrollSchema = z.object({
  ref: z.string().optional().describe('Element ref to scroll into view'),
  selector: z.string().optional().describe('CSS selector of element to scroll into view'),
  direction: z.enum(['up', 'down', 'left', 'right']).optional().describe('Scroll direction for page scroll'),
  amount: z.number().optional().describe('Scroll amount in pixels (default: 500)'),
  toTop: z.boolean().optional().describe('Scroll to top of page'),
  toBottom: z.boolean().optional().describe('Scroll to bottom of page'),
  snapshot: z.object({
    include: z.boolean().optional(),
    scope: z.string().optional(),
    format: z.enum(['compact', 'full', 'diff', 'minimal']).optional(),
  }).optional(),
  timeout: z.number().optional(),
});

export type ScrollInput = z.infer<typeof scrollSchema>;

// Execute scroll
export async function executeScroll(input: ScrollInput): Promise<ToolResponse> {
  const page = await browserManager.getPage();

  try {
    if (input.ref || input.selector) {
      // Scroll element into view
      const locator = await refManager.getLocator(page, input.ref || input.selector!);
      await locator.scrollIntoViewIfNeeded({ timeout: input.timeout ?? 30000 });
    } else if (input.toTop) {
      // Scroll to top
      await page.evaluate(() => window.scrollTo(0, 0));
    } else if (input.toBottom) {
      // Scroll to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    } else if (input.direction) {
      // Scroll by amount in direction
      const amount = input.amount ?? 500;
      const scrollX = input.direction === 'left' ? -amount : input.direction === 'right' ? amount : 0;
      const scrollY = input.direction === 'up' ? -amount : input.direction === 'down' ? amount : 0;
      await page.evaluate(({ x, y }) => window.scrollBy(x, y), { x: scrollX, y: scrollY });
    } else {
      // Default: scroll down
      await page.evaluate(() => window.scrollBy(0, 500));
    }

    // Build response
    const response: ToolResponse = { ok: true };

    // Include snapshot if requested
    if (input.snapshot?.include) {
      const url = page.url();
      const title = await page.title();
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
export const scrollTool = {
  name: 'browser_scroll',
  description: 'Scroll the page or an element into view. Can scroll by direction/amount or to top/bottom.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      ref: { type: 'string', description: 'Element ref to scroll into view' },
      selector: { type: 'string', description: 'CSS selector of element to scroll into view' },
      direction: { type: 'string', enum: ['up', 'down', 'left', 'right'], description: 'Scroll direction for page scroll' },
      amount: { type: 'number', description: 'Scroll amount in pixels (default: 500)' },
      toTop: { type: 'boolean', description: 'Scroll to top of page' },
      toBottom: { type: 'boolean', description: 'Scroll to bottom of page' },
      snapshot: {
        type: 'object',
        properties: {
          include: { type: 'boolean' },
          scope: { type: 'string' },
          format: { type: 'string', enum: ['compact', 'full', 'diff', 'minimal'] },
        },
      },
      timeout: { type: 'number' },
    },
    required: [],
  },
};
