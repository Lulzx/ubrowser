import { z } from 'zod';
import { browserManager } from '../browser/manager.js';
import { extractInteractiveElements } from '../snapshot/extractor.js';
import { filterElements } from '../snapshot/pruner.js';
import { formatSnapshot } from '../snapshot/formatter.js';
import { executeNavigate } from './navigate.js';
import { executeClick } from './click.js';
import { executeType } from './type.js';
import { executeSelect } from './select.js';
import { executeScroll } from './scroll.js';
// Schema for batch tool
export const batchSchema = z.object({
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
// Execute a single step
async function executeStep(step) {
    switch (step.tool) {
        case 'navigate':
            return executeNavigate(step.args);
        case 'click':
            return executeClick(step.args);
        case 'type':
            return executeType(step.args);
        case 'select':
            return executeSelect(step.args);
        case 'scroll':
            return executeScroll(step.args);
        case 'wait':
            // Simple wait
            const ms = step.args.ms ?? 1000;
            await new Promise(resolve => setTimeout(resolve, ms));
            return { ok: true };
        default:
            return { ok: false, error: `Unknown tool: ${step.tool}` };
    }
}
// Execute batch - returns minified result for token efficiency
export async function executeBatch(input) {
    const page = await browserManager.getPage();
    const snapshotConfig = input.snapshot ?? { when: 'final' };
    const stopOnError = input.stopOnError !== false;
    const result = { ok: true };
    let completed = 0;
    for (let i = 0; i < input.steps.length; i++) {
        const step = input.steps[i];
        const stepResult = await executeStep(step);
        if (stepResult.ok) {
            completed++;
            // Take snapshot after each step if configured
            if (snapshotConfig.when === 'each') {
                const url = page.url();
                const title = await page.title();
                const elements = await extractInteractiveElements(page, snapshotConfig.scope);
                const refs = filterElements(elements);
                result.snap = formatSnapshot(refs, url, title, snapshotConfig.format ?? 'compact');
            }
        }
        else {
            result.ok = false;
            result.err = stepResult.error;
            result.at = i;
            result.n = completed;
            // Take snapshot on error if configured
            if (snapshotConfig.when === 'on-error') {
                const url = page.url();
                const title = await page.title();
                const elements = await extractInteractiveElements(page, snapshotConfig.scope);
                const refs = filterElements(elements);
                result.snap = formatSnapshot(refs, url, title, snapshotConfig.format ?? 'compact');
            }
            if (stopOnError)
                break;
        }
    }
    // Take final snapshot if configured
    if (snapshotConfig.when === 'final' && (result.ok || !stopOnError)) {
        const url = page.url();
        const title = await page.title();
        const elements = await extractInteractiveElements(page, snapshotConfig.scope);
        const refs = filterElements(elements);
        result.snap = formatSnapshot(refs, url, title, snapshotConfig.format ?? 'compact');
    }
    return result;
}
// Tool definition for MCP
export const batchTool = {
    name: 'browser_batch',
    description: `Execute multiple browser actions in ONE call. ALWAYS use this for multi-step flows.

Example - Login flow:
{"steps":[{"tool":"navigate","args":{"url":"/login"}},{"tool":"type","args":{"selector":"#email","text":"test@test.com"}},{"tool":"type","args":{"selector":"#password","text":"secret"}},{"tool":"click","args":{"selector":"button[type=submit]"}}],"snapshot":{"when":"final"}}

Returns ultra-compact snapshot format: tag#ref@type~"placeholder"/href"text"!flags
- btn#e1"Submit" = button, click with ref "e1"
- inp#e2@e~"Email" = email input with placeholder
- a#e3/login"Sign in" = link to /login
- Types: @e=email @p=password @t=text @c=checkbox
- Flags: !d=disabled !c=checked !r=required`,
    inputSchema: {
        type: 'object',
        properties: {
            steps: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        tool: { type: 'string', enum: ['navigate', 'click', 'type', 'select', 'scroll', 'wait'] },
                        args: { type: 'object' },
                    },
                    required: ['tool', 'args'],
                },
                description: 'Steps to execute in sequence',
            },
            snapshot: {
                type: 'object',
                properties: {
                    when: { type: 'string', enum: ['never', 'final', 'each', 'on-error'], description: 'When to take snapshots (default: final)' },
                    scope: { type: 'string', description: 'CSS selector to scope snapshots' },
                    format: { type: 'string', enum: ['compact', 'full', 'diff'], description: 'Snapshot format (default: compact)' },
                },
            },
            stopOnError: { type: 'boolean', description: 'Stop on first error (default: true)' },
        },
        required: ['steps'],
    },
};
//# sourceMappingURL=batch.js.map