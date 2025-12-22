import { z } from 'zod';
import { browserManager } from '../browser/manager.js';
import { extractInteractiveElementsFast, clearFastExtractorCache, getElementPosition } from '../snapshot/fast-extractor.js';
import { filterElements } from '../snapshot/pruner.js';
import { formatSnapshot } from '../snapshot/formatter.js';
import { fastClick, fastType, fastKeyPress, fastScroll, fastFocus } from '../browser/fast-actions.js';
import { refManager } from '../refs/manager.js';
import { clearSnapshotCache } from '../snapshot/formatter.js';
import { cleanError } from '../types.js';
import { clearSnapshotElements } from './snapshot.js';
import { DEFAULT_MAX_ELEMENTS } from '../snapshot/limits.js';
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
        maxElements: z.number().optional().describe('Maximum number of elements to return'),
    }).optional().describe('Snapshot options'),
    stopOnError: z.boolean().optional().describe('Stop execution on first error (default: true)'),
});
// Last extracted elements for position lookups
let lastElements = [];
// Execute a single step using fast path when possible
async function executeStepFast(page, step) {
    switch (step.tool) {
        case 'navigate': {
            const url = step.args.url;
            const waitUntil = step.args.waitUntil ?? 'domcontentloaded';
            const timeout = step.args.timeout ?? 30000;
            // Clear caches on navigation
            refManager.clear();
            clearSnapshotCache();
            clearFastExtractorCache(page);
            lastElements = [];
            clearSnapshotElements();
            await page.goto(url, { waitUntil, timeout });
            return { ok: true };
        }
        case 'click': {
            const ref = step.args.ref;
            const selector = step.args.selector;
            const button = step.args.button ?? 'left';
            const clickCount = step.args.clickCount ?? 1;
            const timeout = step.args.timeout ?? 5000;
            // Try fast click first if we have position from snapshot
            if (ref && lastElements.length > 0) {
                const pos = getElementPosition(lastElements, ref);
                if (pos) {
                    await fastClick(page, pos.x, pos.y, { button, clickCount });
                    return { ok: true };
                }
            }
            // Fallback to Playwright for reliability
            const locator = await refManager.getLocator(page, ref || selector, { strict: false });
            await locator.click({ button, clickCount, timeout });
            return { ok: true };
        }
        case 'type': {
            const ref = step.args.ref;
            const selector = step.args.selector;
            const text = step.args.text;
            const clear = step.args.clear !== false;
            const pressEnter = step.args.pressEnter;
            const delay = step.args.delay;
            const timeout = step.args.timeout ?? 5000;
            // Try fast type if we have position
            if (ref && lastElements.length > 0 && !delay) {
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
            const locator = await refManager.getLocator(page, ref || selector, { strict: false });
            if (clear && !delay && !pressEnter) {
                await locator.fill(text, { timeout });
            }
            else if (clear) {
                if (delay && delay > 0) {
                    await locator.clear({ timeout });
                    await locator.type(text, { delay, timeout });
                }
                else {
                    await locator.fill(text, { timeout });
                }
                if (pressEnter)
                    await locator.press('Enter', { timeout });
            }
            else {
                if (delay && delay > 0) {
                    await locator.type(text, { delay, timeout });
                }
                else {
                    await locator.type(text, { timeout });
                }
                if (pressEnter)
                    await locator.press('Enter', { timeout });
            }
            return { ok: true };
        }
        case 'select': {
            const ref = step.args.ref;
            const selector = step.args.selector;
            const value = step.args.value;
            const label = step.args.label;
            const index = step.args.index;
            const timeout = step.args.timeout ?? 5000;
            const locator = await refManager.getLocator(page, ref || selector, { strict: false });
            if (value !== undefined) {
                await locator.selectOption({ value }, { timeout });
            }
            else if (label !== undefined) {
                await locator.selectOption({ label }, { timeout });
            }
            else if (index !== undefined) {
                await locator.selectOption({ index }, { timeout });
            }
            return { ok: true };
        }
        case 'scroll': {
            const direction = step.args.direction;
            const amount = step.args.amount ?? 500;
            const toTop = step.args.toTop;
            const toBottom = step.args.toBottom;
            const ref = step.args.ref;
            const selector = step.args.selector;
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
                case 'up':
                    deltaY = -amount;
                    break;
                case 'down':
                    deltaY = amount;
                    break;
                case 'left':
                    deltaX = -amount;
                    break;
                case 'right':
                    deltaX = amount;
                    break;
            }
            // Use fast scroll via CDP
            if (ref || selector) {
                const locator = await refManager.getLocator(page, ref || selector, { strict: false });
                await locator.scrollIntoViewIfNeeded();
            }
            else {
                await fastScroll(page, deltaX, deltaY);
            }
            return { ok: true };
        }
        case 'wait': {
            const ms = step.args.ms ?? 1000;
            await new Promise(resolve => setTimeout(resolve, ms));
            return { ok: true };
        }
        default:
            return { ok: false, error: `Unknown tool: ${step.tool}` };
    }
}
// Helper to take snapshot efficiently using fast extractor
async function takeSnapshotFast(page, scope, format, maxElements) {
    // Use fast extraction
    const [url, title, elements] = await Promise.all([
        Promise.resolve(page.url()), // url() is synchronous
        page.title(),
        extractInteractiveElementsFast(page, scope, {
            skipCache: format === 'diff',
            maxElements,
        }),
    ]);
    // Store for fast operations
    lastElements = elements;
    const refs = filterElements(elements, maxElements ? { maxElements } : undefined);
    return formatSnapshot(refs, url, title, format ?? 'compact');
}
// Execute batch - returns minified result for token efficiency
export async function executeFastBatch(input) {
    const page = await browserManager.getPage();
    const snapshotConfig = input.snapshot ?? { when: 'final' };
    const snapshotMaxElements = snapshotConfig.maxElements ?? DEFAULT_MAX_ELEMENTS;
    const stopOnError = input.stopOnError !== false;
    const result = { ok: true };
    let completed = 0;
    // Pre-fetch snapshot for fast operations if we'll need positions
    const needsPositions = input.steps.some(s => (s.tool === 'click' || s.tool === 'type') && s.args.ref);
    if (needsPositions && lastElements.length === 0) {
        // Get initial snapshot for positions
        await extractInteractiveElementsFast(page, snapshotConfig.scope, {
            maxElements: snapshotMaxElements,
        }).then(els => {
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
                    result.snap = await takeSnapshotFast(page, snapshotConfig.scope, snapshotConfig.format, snapshotMaxElements);
                }
            }
            else {
                result.ok = false;
                result.err = stepResult.error ? cleanError(stepResult.error) : 'Unknown error';
                result.at = i;
                result.n = completed;
                // Take snapshot on error if configured
                if (snapshotConfig.when === 'on-error') {
                    result.snap = await takeSnapshotFast(page, snapshotConfig.scope, snapshotConfig.format, snapshotMaxElements);
                }
                if (stopOnError)
                    break;
            }
        }
        catch (error) {
            result.ok = false;
            result.err = cleanError(error);
            result.at = i;
            result.n = completed;
            if (snapshotConfig.when === 'on-error') {
                result.snap = await takeSnapshotFast(page, snapshotConfig.scope, snapshotConfig.format, snapshotMaxElements);
            }
            if (stopOnError)
                break;
        }
    }
    // Take final snapshot if configured
    if (snapshotConfig.when === 'final' && (result.ok || !stopOnError)) {
        result.snap = await takeSnapshotFast(page, snapshotConfig.scope, snapshotConfig.format, snapshotMaxElements);
    }
    return result;
}
//# sourceMappingURL=fast-batch.js.map