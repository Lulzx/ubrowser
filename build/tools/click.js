import { z } from 'zod';
import { browserManager } from '../browser/manager.js';
import { refManager } from '../refs/manager.js';
import { extractInteractiveElementsFast, getElementPosition } from '../snapshot/fast-extractor.js';
import { filterElements } from '../snapshot/pruner.js';
import { formatSnapshot } from '../snapshot/formatter.js';
import { fastClick } from '../browser/fast-actions.js';
import { cleanError } from '../types.js';
import { getLastSnapshotElements } from './snapshot.js';
import { DEFAULT_MAX_ELEMENTS } from '../snapshot/limits.js';
// Schema for click tool
export const clickSchema = z.object({
    ref: z.string().optional().describe('Element ref (e.g., "e1") from a previous snapshot'),
    selector: z.string().optional().describe('CSS selector if ref not provided'),
    button: z.enum(['left', 'right', 'middle']).optional().describe('Mouse button (default: left)'),
    clickCount: z.number().optional().describe('Number of clicks (default: 1)'),
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
// Execute click - uses fast CDP path when element position is known
export async function executeClick(input) {
    const page = await browserManager.getPage();
    const timeout = input.timeout ?? 5000;
    try {
        const button = input.button ?? 'left';
        const clickCount = input.clickCount ?? 1;
        // Try fast click if we have a ref and cached positions from snapshot
        const cachedElements = getLastSnapshotElements();
        if (input.ref && cachedElements.length > 0) {
            const pos = getElementPosition(cachedElements, input.ref);
            if (pos) {
                await fastClick(page, pos.x, pos.y, { button, clickCount });
                // Build response
                const response = { ok: true };
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
        const locator = await refManager.getLocator(page, input.ref || input.selector, { strict: false });
        await locator.click({ button, clickCount, timeout });
        // Build response
        const response = { ok: true };
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
    }
    catch (error) {
        return {
            ok: false,
            error: cleanError(error),
        };
    }
}
// Tool definition for MCP
export const clickTool = {
    name: 'browser_click',
    description: 'Click an element by ref (from snapshot) or CSS selector. Returns success status.',
    inputSchema: {
        type: 'object',
        properties: {
            ref: { type: 'string', description: 'Element ref (e.g., "e1") from a previous snapshot' },
            selector: { type: 'string', description: 'CSS selector if ref not provided' },
            button: { type: 'string', enum: ['left', 'right', 'middle'], description: 'Mouse button (default: left)' },
            clickCount: { type: 'number', description: 'Number of clicks (default: 1)' },
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
        required: [],
    },
};
//# sourceMappingURL=click.js.map