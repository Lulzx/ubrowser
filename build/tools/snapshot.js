import { z } from 'zod';
import { browserManager } from '../browser/manager.js';
import { extractInteractiveElements } from '../snapshot/extractor.js';
import { filterElements } from '../snapshot/pruner.js';
import { formatSnapshot } from '../snapshot/formatter.js';
// Schema for snapshot tool
export const snapshotSchema = z.object({
    scope: z.string().optional().describe('CSS selector to scope the snapshot'),
    format: z.enum(['compact', 'full', 'diff', 'minimal']).optional().describe('Snapshot format (default: compact)'),
    maxElements: z.number().optional().describe('Maximum number of elements to return'),
});
// Execute snapshot
export async function executeSnapshot(input) {
    const page = await browserManager.getPage();
    try {
        const url = page.url();
        const title = await page.title();
        // Extract interactive elements
        const elements = await extractInteractiveElements(page, input.scope);
        const refs = filterElements(elements, { maxElements: input.maxElements });
        // Format the snapshot
        const snapshot = formatSnapshot(refs, url, title, input.format ?? 'compact');
        return {
            ok: true,
            snapshot,
            url,
            title,
        };
    }
    catch (error) {
        return {
            ok: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
// Tool definition for MCP
export const snapshotTool = {
    name: 'browser_snapshot',
    description: 'Get a snapshot of interactive elements on the current page. Returns elements with refs (e1, e2, etc.) that can be used with other tools.',
    inputSchema: {
        type: 'object',
        properties: {
            scope: { type: 'string', description: 'CSS selector to scope the snapshot' },
            format: { type: 'string', enum: ['compact', 'full', 'diff', 'minimal'], description: 'Snapshot format (default: compact)' },
            maxElements: { type: 'number', description: 'Maximum number of elements to return' },
        },
        required: [],
    },
};
//# sourceMappingURL=snapshot.js.map