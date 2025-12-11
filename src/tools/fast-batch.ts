import { z } from 'zod';
import { browserManager } from '../browser/manager.js';
import { extractInteractiveElementsFast, clearFastExtractorCache, getElementPosition, type ExtractedElement } from '../snapshot/fast-extractor.js';
import { filterElements } from '../snapshot/pruner.js';
import { formatSnapshot } from '../snapshot/formatter.js';
import { fastClick, fastType, fastKeyPress, fastScroll, fastFocus } from '../browser/fast-actions.js';
import { refManager } from '../refs/manager.js';
import { clearSnapshotCache } from '../snapshot/formatter.js';
import { cleanError, type ToolResponse, type BatchStep } from '../types.js';
import type { Page } from 'playwright';

// Schema for batch tool
export const fastBatchSchema = z.object({
  steps: z.array(z.object({
    tool: z.enum(['navigate', 'click', 'type', 'select', 'scroll', 'wait']).describe('Tool to execute'),
    args: z.record(z.any()).describe('Arguments for the tool'),
  })).describe('Steps to execute in sequence'),
  snapshot: z.object({
    when: z.enum(['never', 'final', 'each', 'on-error']).optional().describe('When to take snapshots'),
    scope: z.string().optional().describe('CSS selector to scope snapshots'),
    format: z.enum(['compact', 'full', 'diff']).optional().describe('Snapshot format (default: compact)'),
  }).optional().describe('Snapshot options'),
  stopOnError: z.boolean().optional().describe('Stop execution on first error (default: true)'),
});

export type FastBatchInput = z.infer<typeof fastBatchSchema>;

// Minified result structure for token efficiency
interface BatchResult {
  ok: boolean;
  n?: number;         // stepsCompleted (only if partial)
  err?: string;       // error message
  at?: number;        // failedStep
  snap?: string;      // snapshot
}

// Last extracted elements for position lookups
let lastElements: ExtractedElement[] = [];

// Execute a single step using fast path when possible
async function executeStepFast(page: Page, step: BatchStep): Promise<ToolResponse> {
  switch (step.tool) {
    case 'navigate': {
      const url = step.args.url as string;
      const waitUntil = (step.args.waitUntil as 'load' | 'domcontentloaded' | 'networkidle') ?? 'domcontentloaded';
      const timeout = (step.args.timeout as number) ?? 10000;

      // Clear caches on navigation
      refManager.clear();
      clearSnapshotCache();
      clearFastExtractorCache(page);
      lastElements = [];

      await page.goto(url, { waitUntil, timeout });
      return { ok: true };
    }

    case 'click': {
      const ref = step.args.ref as string | undefined;
      const selector = step.args.selector as string | undefined;
      const button = (step.args.button as 'left' | 'right' | 'middle') ?? 'left';
      const clickCount = (step.args.clickCount as number) ?? 1;
      const timeout = (step.args.timeout as number) ?? 5000;

      // Try fast click first if we have position from snapshot
      if (ref && lastElements.length > 0) {
        const pos = getElementPosition(lastElements, ref);
        if (pos) {
          await fastClick(page, pos.x, pos.y, { button, clickCount });
          return { ok: true };
        }
      }

      // Fallback to Playwright for reliability
      const locator = await refManager.getLocator(page, ref || selector!, { strict: false });
      await locator.click({ button, clickCount, timeout });
      return { ok: true };
    }

    case 'type': {
      const ref = step.args.ref as string | undefined;
      const selector = step.args.selector as string | undefined;
      const text = step.args.text as string;
      const clear = step.args.clear !== false;
      const pressEnter = step.args.pressEnter as boolean | undefined;
      const timeout = (step.args.timeout as number) ?? 5000;

      // Try fast type if we have position
      if (ref && lastElements.length > 0) {
        const pos = getElementPosition(lastElements, ref);
        if (pos) {
          // Focus the element first
          await fastFocus(page, pos.x, pos.y);
          // Type using CDP
          await fastType(page, text, { clear });
          if (pressEnter) {
            await fastKeyPress(page, 'Enter');
          }
          return { ok: true };
        }
      }

      // Fallback to Playwright
      const locator = await refManager.getLocator(page, ref || selector!, { strict: false });
      if (clear && !pressEnter) {
        await locator.fill(text, { timeout });
      } else {
        if (clear) await locator.clear({ timeout });
        await locator.fill(text, { timeout });
        if (pressEnter) await locator.press('Enter', { timeout });
      }
      return { ok: true };
    }

    case 'select': {
      const ref = step.args.ref as string | undefined;
      const selector = step.args.selector as string | undefined;
      const value = step.args.value as string | undefined;
      const label = step.args.label as string | undefined;
      const index = step.args.index as number | undefined;
      const timeout = (step.args.timeout as number) ?? 5000;

      const locator = await refManager.getLocator(page, ref || selector!, { strict: false });
      if (value !== undefined) {
        await locator.selectOption({ value }, { timeout });
      } else if (label !== undefined) {
        await locator.selectOption({ label }, { timeout });
      } else if (index !== undefined) {
        await locator.selectOption({ index }, { timeout });
      }
      return { ok: true };
    }

    case 'scroll': {
      const direction = step.args.direction as 'up' | 'down' | 'left' | 'right' | undefined;
      const amount = (step.args.amount as number) ?? 300;
      const toTop = step.args.toTop as boolean | undefined;
      const toBottom = step.args.toBottom as boolean | undefined;
      const ref = step.args.ref as string | undefined;
      const selector = step.args.selector as string | undefined;

      // Handle scroll to top/bottom
      if (toTop || toBottom) {
        await page.evaluate((bottom) => {
          window.scrollTo({ top: bottom ? document.body.scrollHeight : 0, behavior: 'instant' });
        }, toBottom);
        return { ok: true };
      }

      // Calculate scroll delta
      let deltaX = 0;
      let deltaY = 0;
      switch (direction) {
        case 'up': deltaY = -amount; break;
        case 'down': deltaY = amount; break;
        case 'left': deltaX = -amount; break;
        case 'right': deltaX = amount; break;
      }

      // Use fast scroll via CDP
      if (ref || selector) {
        const locator = await refManager.getLocator(page, ref || selector!, { strict: false });
        await locator.scrollIntoViewIfNeeded();
      } else {
        await fastScroll(page, deltaX, deltaY);
      }
      return { ok: true };
    }

    case 'wait': {
      const ms = (step.args.ms as number) ?? 1000;
      await new Promise(resolve => setTimeout(resolve, ms));
      return { ok: true };
    }

    default:
      return { ok: false, error: `Unknown tool: ${step.tool}` };
  }
}

// Helper to take snapshot efficiently using fast extractor
async function takeSnapshotFast(
  page: Page,
  scope?: string,
  format?: 'compact' | 'full' | 'diff'
): Promise<string> {
  // Use fast extraction
  const [url, title, elements] = await Promise.all([
    Promise.resolve(page.url()), // url() is synchronous
    page.title(),
    extractInteractiveElementsFast(page, scope, { skipCache: format === 'diff' }),
  ]);

  // Store for fast operations
  lastElements = elements;

  const refs = filterElements(elements);
  return formatSnapshot(refs, url, title, format ?? 'compact');
}

// Execute batch - returns minified result for token efficiency
export async function executeFastBatch(input: FastBatchInput): Promise<BatchResult> {
  const page = await browserManager.getPage();
  const snapshotConfig = input.snapshot ?? { when: 'final' };
  const stopOnError = input.stopOnError !== false;

  const result: BatchResult = { ok: true };
  let completed = 0;

  // Pre-fetch snapshot for fast operations if we'll need positions
  const needsPositions = input.steps.some(
    s => (s.tool === 'click' || s.tool === 'type') && s.args.ref
  );
  if (needsPositions && lastElements.length === 0) {
    // Get initial snapshot for positions
    await extractInteractiveElementsFast(page, snapshotConfig.scope).then(els => {
      lastElements = els;
    });
  }

  for (let i = 0; i < input.steps.length; i++) {
    const step = input.steps[i];

    try {
      const stepResult = await executeStepFast(page, step);

      if (stepResult.ok) {
        completed++;
        // Take snapshot after each step if configured
        if (snapshotConfig.when === 'each') {
          result.snap = await takeSnapshotFast(page, snapshotConfig.scope, snapshotConfig.format);
        }
      } else {
        result.ok = false;
        result.err = stepResult.error ? cleanError(stepResult.error) : 'Unknown error';
        result.at = i;
        result.n = completed;

        // Take snapshot on error if configured
        if (snapshotConfig.when === 'on-error') {
          result.snap = await takeSnapshotFast(page, snapshotConfig.scope, snapshotConfig.format);
        }

        if (stopOnError) break;
      }
    } catch (error) {
      result.ok = false;
      result.err = cleanError(error);
      result.at = i;
      result.n = completed;

      if (snapshotConfig.when === 'on-error') {
        result.snap = await takeSnapshotFast(page, snapshotConfig.scope, snapshotConfig.format);
      }

      if (stopOnError) break;
    }
  }

  // Take final snapshot if configured
  if (snapshotConfig.when === 'final' && (result.ok || !stopOnError)) {
    result.snap = await takeSnapshotFast(page, snapshotConfig.scope, snapshotConfig.format);
  }

  return result;
}
