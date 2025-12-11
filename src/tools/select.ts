import { z } from 'zod';
import { browserManager } from '../browser/manager.js';
import { refManager } from '../refs/manager.js';
import { extractInteractiveElements } from '../snapshot/extractor.js';
import { filterElements } from '../snapshot/pruner.js';
import { formatSnapshot } from '../snapshot/formatter.js';
import type { ToolResponse } from '../types.js';

// Schema for select tool
export const selectSchema = z.object({
  ref: z.string().optional().describe('Element ref (e.g., "e1") from a previous snapshot'),
  selector: z.string().optional().describe('CSS selector if ref not provided'),
  value: z.string().optional().describe('Option value to select'),
  label: z.string().optional().describe('Option label (visible text) to select'),
  index: z.number().optional().describe('Option index to select (0-based)'),
  snapshot: z.object({
    include: z.boolean().optional(),
    scope: z.string().optional(),
    format: z.enum(['compact', 'full', 'diff', 'minimal']).optional(),
  }).optional(),
  timeout: z.number().optional(),
}).refine(data => data.ref || data.selector, {
  message: 'Either ref or selector must be provided',
}).refine(data => data.value || data.label || data.index !== undefined, {
  message: 'Must specify value, label, or index',
});

export type SelectInput = z.infer<typeof selectSchema>;

// Execute select
export async function executeSelect(input: SelectInput): Promise<ToolResponse> {
  const page = await browserManager.getPage();
  const timeout = input.timeout ?? 30000;

  try {
    // Get locator from ref or selector
    const locator = await refManager.getLocator(page, input.ref || input.selector!);

    // Select the option
    if (input.value) {
      await locator.selectOption({ value: input.value }, { timeout });
    } else if (input.label) {
      await locator.selectOption({ label: input.label }, { timeout });
    } else if (input.index !== undefined) {
      await locator.selectOption({ index: input.index }, { timeout });
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
export const selectTool = {
  name: 'browser_select',
  description: 'Select an option from a dropdown by value, label, or index.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      ref: { type: 'string', description: 'Element ref (e.g., "e1") from a previous snapshot' },
      selector: { type: 'string', description: 'CSS selector if ref not provided' },
      value: { type: 'string', description: 'Option value to select' },
      label: { type: 'string', description: 'Option label (visible text) to select' },
      index: { type: 'number', description: 'Option index to select (0-based)' },
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
