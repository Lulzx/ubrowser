import { z } from 'zod';
import { browserManager } from '../browser/manager.js';
import { extractInteractiveElements } from '../snapshot/extractor.js';
import { filterElements } from '../snapshot/pruner.js';
import { formatSnapshot } from '../snapshot/formatter.js';
import type { ToolResponse } from '../types.js';

// Schema for inspect tool
export const inspectSchema = z.object({
  selector: z.string().describe('CSS selector of element to inspect'),
  depth: z.number().optional().describe('Max depth of nested elements to include (default: 3)'),
  includeText: z.boolean().optional().describe('Include text content of elements'),
  format: z.enum(['compact', 'full', 'minimal']).optional().describe('Output format (default: compact)'),
});

export type InspectInput = z.infer<typeof inspectSchema>;

interface InspectResult {
  ok: boolean;
  exists: boolean;
  visible?: boolean;
  tagName?: string;
  text?: string;
  attributes?: Record<string, string>;
  childCount?: number;
  snapshot?: string;
  error?: string;
}

// Execute inspect
export async function executeInspect(input: InspectInput): Promise<InspectResult> {
  const page = await browserManager.getPage();

  try {
    const locator = page.locator(input.selector);
    const count = await locator.count();

    if (count === 0) {
      return {
        ok: true,
        exists: false,
      };
    }

    // Get element info
    const elementInfo = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;

      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();

      return {
        tagName: el.tagName.toLowerCase(),
        text: el.textContent?.trim().substring(0, 200) || '',
        visible: style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0,
        attributes: Object.fromEntries(
          Array.from(el.attributes).map(attr => [attr.name, attr.value])
        ),
        childCount: el.children.length,
      };
    }, input.selector);

    if (!elementInfo) {
      return {
        ok: true,
        exists: false,
      };
    }

    const result: InspectResult = {
      ok: true,
      exists: true,
      visible: elementInfo.visible,
      tagName: elementInfo.tagName,
      attributes: elementInfo.attributes,
      childCount: elementInfo.childCount,
    };

    if (input.includeText) {
      result.text = elementInfo.text;
    }

    // Get scoped snapshot
    if (input.format !== 'minimal') {
      const url = page.url();
      const title = await page.title();
      const elements = await extractInteractiveElements(page, input.selector);
      const refs = filterElements(elements, { maxElements: 50 });
      result.snapshot = formatSnapshot(refs, url, title, input.format ?? 'compact');
    }

    return result;
  } catch (error) {
    return {
      ok: false,
      exists: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Tool definition for MCP
export const inspectTool = {
  name: 'browser_inspect',
  description: 'Inspect a specific element and get its details. Use this for targeted exploration of a specific region instead of full page snapshots.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      selector: { type: 'string', description: 'CSS selector of element to inspect' },
      depth: { type: 'number', description: 'Max depth of nested elements (default: 3)' },
      includeText: { type: 'boolean', description: 'Include text content' },
      format: { type: 'string', enum: ['compact', 'full', 'minimal'], description: 'Output format (default: compact)' },
    },
    required: ['selector'],
  },
};
