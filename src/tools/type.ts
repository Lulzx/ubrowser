import { z } from 'zod';
import { browserManager } from '../browser/manager.js';
import { refManager } from '../refs/manager.js';
import { extractInteractiveElements } from '../snapshot/extractor.js';
import { filterElements } from '../snapshot/pruner.js';
import { formatSnapshot } from '../snapshot/formatter.js';
import type { ToolResponse } from '../types.js';

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
    format: z.enum(['full', 'diff', 'minimal']).optional(),
  }).optional(),
  timeout: z.number().optional(),
}).refine(data => data.ref || data.selector, {
  message: 'Either ref or selector must be provided',
});

export type TypeInput = z.infer<typeof typeSchema>;

// Execute type
export async function executeType(input: TypeInput): Promise<ToolResponse> {
  const page = await browserManager.getPage();
  const timeout = input.timeout ?? 30000;

  try {
    // Get locator from ref or selector
    const locator = await refManager.getLocator(page, input.ref || input.selector!);

    // Clear existing text if requested (default: true)
    if (input.clear !== false) {
      await locator.clear({ timeout });
    }

    // Type the text
    await locator.fill(input.text, { timeout });

    // Press Enter if requested
    if (input.pressEnter) {
      await locator.press('Enter', { timeout });
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
        input.snapshot.format ?? 'full'
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
          format: { type: 'string', enum: ['full', 'diff', 'minimal'] },
        },
      },
      timeout: { type: 'number' },
    },
    required: ['text'],
  },
};
