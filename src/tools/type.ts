import { z } from 'zod';
import { browserManager } from '../browser/manager.js';
import { refManager } from '../refs/manager.js';
import { extractInteractiveElementsFast, getElementPosition } from '../snapshot/fast-extractor.js';
import { filterElements } from '../snapshot/pruner.js';
import { formatSnapshot } from '../snapshot/formatter.js';
import { fastType, fastKeyPress, fastFocus } from '../browser/fast-actions.js';
import { cleanError, type ToolResponse } from '../types.js';
import { getLastSnapshotElements } from './snapshot.js';
import { DEFAULT_MAX_ELEMENTS } from '../snapshot/limits.js';

// Schema for type tool
export const typeSchema = z.object({
  ref: z.string().optional().describe('Element ref (e.g., "e1") from a previous snapshot'),
  selector: z.string().optional().describe('CSS selector if ref not provided'),
  text: z.string().describe('Text to type'),
  clear: z.boolean().optional().describe('Clear existing text first (default: true)'),
  pressEnter: z.boolean().optional().describe('Press Enter after typing'),
  delay: z.number().optional().describe('Delay between keystrokes in ms'),
  snapshot: z.object({
    include: z.boolean().optional(),
    scope: z.string().optional(),
    format: z.enum(['compact', 'full', 'diff', 'minimal']).optional(),
    maxElements: z.number().optional(),
  }).optional(),
  timeout: z.number().optional(),
}).refine(data => data.ref || data.selector, {
  message: 'Either ref or selector must be provided',
});

export type TypeInput = z.infer<typeof typeSchema>;

// Execute type - uses fast CDP path when element position is known
export async function executeType(input: TypeInput): Promise<ToolResponse> {
  const page = await browserManager.getPage();
  const timeout = input.timeout ?? 5000;

  try {
    // Try fast type if we have a ref, cached positions from snapshot, and no delay
    const cachedElements = getLastSnapshotElements();
    if (input.ref && cachedElements.length > 0 && !input.delay) {
      const pos = getElementPosition(cachedElements, input.ref);
      if (pos) {
        // Focus the element first via fast click
        await fastFocus(page, pos.x, pos.y);
        // Type using CDP (instant)
        await fastType(page, input.text, { clear: input.clear !== false });
        // Press Enter if requested
        if (input.pressEnter) {
          await fastKeyPress(page, 'Enter');
        }

        // Build response
        const response: ToolResponse = { ok: true };
        if (input.snapshot?.include) {
          const maxElements = input.snapshot?.maxElements ?? DEFAULT_MAX_ELEMENTS;
          const [url, title, elements] = await Promise.all([
            Promise.resolve(page.url()),
            page.title(),
            extractInteractiveElementsFast(page, input.snapshot.scope, { maxElements }),
          ]);
          const refs = filterElements(elements, maxElements ? { maxElements } : undefined);
          response.snapshot = formatSnapshot(refs, url, title, input.snapshot.format ?? 'compact');
        }
        return response;
      }
    }

    // Fallback to Playwright for reliability
    const locator = await refManager.getLocator(page, input.ref || input.selector!, { strict: false });

    const shouldClear = input.clear !== false;
    const delay = input.delay;
    const pressEnter = input.pressEnter;

    // Clear and fill in one operation when possible (most common case)
    if (shouldClear && !delay && !pressEnter) {
      // fill() clears automatically and is fastest
      await locator.fill(input.text, { timeout });
    } else {
      if (shouldClear) {
        if (delay && delay > 0) {
          await locator.clear({ timeout });
          await locator.type(input.text, { delay, timeout });
        } else {
          await locator.fill(input.text, { timeout });
        }
      } else {
        if (delay && delay > 0) {
          await locator.type(input.text, { delay, timeout });
        } else {
          await locator.type(input.text, { timeout });
        }
      }
      if (pressEnter) await locator.press('Enter', { timeout });
    }

    // Build response
    const response: ToolResponse = { ok: true };

    // Include snapshot if requested
    if (input.snapshot?.include) {
      const maxElements = input.snapshot?.maxElements ?? DEFAULT_MAX_ELEMENTS;
      const [url, title, elements] = await Promise.all([
        Promise.resolve(page.url()),
        page.title(),
        extractInteractiveElementsFast(page, input.snapshot.scope, { maxElements }),
      ]);
      const refs = filterElements(elements, maxElements ? { maxElements } : undefined);
      response.snapshot = formatSnapshot(refs, url, title, input.snapshot.format ?? 'compact');
    }

    return response;
  } catch (error) {
    return {
      ok: false,
      error: cleanError(error),
    };
  }
}

// Tool definition for MCP
export const typeTool = {
  name: 'browser_type',
  description: 'Type text into an input field. Clears existing text by default.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      ref: { type: 'string', description: 'Element ref (e.g., "e1") from a previous snapshot' },
      selector: { type: 'string', description: 'CSS selector if ref not provided' },
      text: { type: 'string', description: 'Text to type' },
      clear: { type: 'boolean', description: 'Clear existing text first (default: true)' },
      pressEnter: { type: 'boolean', description: 'Press Enter after typing' },
      delay: { type: 'number', description: 'Delay between keystrokes in ms' },
      snapshot: {
        type: 'object',
        properties: {
          include: { type: 'boolean' },
          scope: { type: 'string' },
          format: { type: 'string', enum: ['compact', 'full', 'diff', 'minimal'] },
          maxElements: { type: 'number' },
        },
      },
      timeout: { type: 'number' },
    },
    required: ['text'],
  },
};
