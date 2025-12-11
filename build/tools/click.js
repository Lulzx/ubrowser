import { z } from 'zod';
import { browserManager } from '../browser/manager.js';
import { refManager } from '../refs/manager.js';
import { extractInteractiveElements } from '../snapshot/extractor.js';
import { filterElements } from '../snapshot/pruner.js';
import { formatSnapshot } from '../snapshot/formatter.js';
import { cleanError } from '../types.js';
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
    }).optional(),
    timeout: z.number().optional(),
}).refine(data => data.ref || data.selector, {
    message: 'Either ref or selector must be provided',
});
// Execute click
export async function executeClick(input) {
    const page = await browserManager.getPage();
    const timeout = input.timeout ?? 30000;
    try {
        // Get locator from ref or selector
        const locator = await refManager.getLocator(page, input.ref || input.selector, { strict: false });
        // Wait for element to be visible before clicking (with shorter timeout for visibility check)
        const visibilityTimeout = Math.min(timeout, 10000);
        try {
            await locator.waitFor({ state: 'visible', timeout: visibilityTimeout });
        }
        catch {
            // If not visible, check if it exists at all
            const count = await locator.count();
            if (count === 0) {
                // Try to provide helpful error with available elements
                const selector = input.ref || input.selector;
                return {
                    ok: false,
                    error: `Element not found: "${selector}". Take a snapshot to see available elements.`,
                };
            }
            // Element exists but not visible - try scrolling into view
            await locator.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => { });
        }
        // Click the element
        await locator.click({
            button: input.button ?? 'left',
            clickCount: input.clickCount ?? 1,
            timeout,
        });
        // Build response
        const response = { ok: true };
        // Include snapshot if requested
        if (input.snapshot?.include) {
            const url = page.url();
            const title = await page.title();
            const elements = await extractInteractiveElements(page, input.snapshot.scope);
            const refs = filterElements(elements);
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
                },
            },
            timeout: { type: 'number' },
        },
        required: [],
    },
};
//# sourceMappingURL=click.js.map