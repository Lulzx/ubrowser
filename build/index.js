#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { browserManager } from './browser/manager.js';
import { navigateTool, executeNavigate, clickTool, executeClick, typeTool, executeType, selectTool, executeSelect, scrollTool, executeScroll, snapshotTool, executeSnapshot, batchTool, executeBatch, inspectTool, executeInspect, pagesTool, executePages, } from './tools/index.js';
// Create MCP server
const server = new McpServer({
    name: 'ubrowser',
    version: '1.0.0',
});
// Register browser_navigate tool
server.tool(navigateTool.name, navigateTool.description, {
    url: z.string().describe('URL to navigate to'),
    waitUntil: z.enum(['load', 'domcontentloaded', 'networkidle']).optional(),
    snapshot: z.object({
        include: z.boolean().optional(),
        scope: z.string().optional(),
        format: z.enum(['compact', 'full', 'diff', 'minimal']).optional(),
    }).optional(),
    timeout: z.number().optional(),
}, async (args) => {
    const result = await executeNavigate(args);
    return {
        content: [{ type: 'text', text: JSON.stringify(result) }],
    };
});
// Register browser_click tool
server.tool(clickTool.name, clickTool.description, {
    ref: z.string().optional().describe('Element ref (e.g., "e1")'),
    selector: z.string().optional().describe('CSS selector'),
    button: z.enum(['left', 'right', 'middle']).optional(),
    clickCount: z.number().optional(),
    snapshot: z.object({
        include: z.boolean().optional(),
        scope: z.string().optional(),
        format: z.enum(['compact', 'full', 'diff', 'minimal']).optional(),
    }).optional(),
    timeout: z.number().optional(),
}, async (args) => {
    const result = await executeClick(args);
    return {
        content: [{ type: 'text', text: JSON.stringify(result) }],
    };
});
// Register browser_type tool
server.tool(typeTool.name, typeTool.description, {
    ref: z.string().optional().describe('Element ref (e.g., "e1")'),
    selector: z.string().optional().describe('CSS selector'),
    text: z.string().describe('Text to type'),
    clear: z.boolean().optional(),
    pressEnter: z.boolean().optional(),
    delay: z.number().optional(),
    snapshot: z.object({
        include: z.boolean().optional(),
        scope: z.string().optional(),
        format: z.enum(['compact', 'full', 'diff', 'minimal']).optional(),
    }).optional(),
    timeout: z.number().optional(),
}, async (args) => {
    const result = await executeType(args);
    return {
        content: [{ type: 'text', text: JSON.stringify(result) }],
    };
});
// Register browser_select tool
server.tool(selectTool.name, selectTool.description, {
    ref: z.string().optional(),
    selector: z.string().optional(),
    value: z.string().optional(),
    label: z.string().optional(),
    index: z.number().optional(),
    snapshot: z.object({
        include: z.boolean().optional(),
        scope: z.string().optional(),
        format: z.enum(['compact', 'full', 'diff', 'minimal']).optional(),
    }).optional(),
    timeout: z.number().optional(),
}, async (args) => {
    const result = await executeSelect(args);
    return {
        content: [{ type: 'text', text: JSON.stringify(result) }],
    };
});
// Register browser_scroll tool
server.tool(scrollTool.name, scrollTool.description, {
    ref: z.string().optional(),
    selector: z.string().optional(),
    direction: z.enum(['up', 'down', 'left', 'right']).optional(),
    amount: z.number().optional(),
    toTop: z.boolean().optional(),
    toBottom: z.boolean().optional(),
    snapshot: z.object({
        include: z.boolean().optional(),
        scope: z.string().optional(),
        format: z.enum(['compact', 'full', 'diff', 'minimal']).optional(),
    }).optional(),
    timeout: z.number().optional(),
}, async (args) => {
    const result = await executeScroll(args);
    return {
        content: [{ type: 'text', text: JSON.stringify(result) }],
    };
});
// Register browser_snapshot tool
server.tool(snapshotTool.name, snapshotTool.description, {
    scope: z.string().optional(),
    format: z.enum(['full', 'diff', 'minimal']).optional(),
    maxElements: z.number().optional(),
}, async (args) => {
    const result = await executeSnapshot(args);
    return {
        content: [{ type: 'text', text: JSON.stringify(result) }],
    };
});
// Register browser_batch tool - THE KEY OPTIMIZATION
server.tool(batchTool.name, batchTool.description, {
    steps: z.array(z.object({
        tool: z.enum(['navigate', 'click', 'type', 'select', 'scroll', 'wait']),
        args: z.record(z.any()),
    })),
    snapshot: z.object({
        when: z.enum(['never', 'final', 'each', 'on-error']).optional(),
        scope: z.string().optional(),
        format: z.enum(['compact', 'full', 'diff']).optional(),
    }).optional(),
    stopOnError: z.boolean().optional(),
}, async (args) => {
    const result = await executeBatch(args);
    return {
        content: [{ type: 'text', text: JSON.stringify(result) }],
    };
});
// Register browser_inspect tool
server.tool(inspectTool.name, inspectTool.description, {
    selector: z.string().describe('CSS selector'),
    depth: z.number().optional(),
    includeText: z.boolean().optional(),
    format: z.enum(['full', 'minimal']).optional(),
}, async (args) => {
    const result = await executeInspect(args);
    return {
        content: [{ type: 'text', text: JSON.stringify(result) }],
    };
});
// Register browser_pages tool - Named pages for multi-page workflows
server.tool(pagesTool.name, pagesTool.description, {
    action: z.enum(['list', 'create', 'switch', 'close']).describe('Action to perform'),
    name: z.string().optional().describe('Page name'),
    snapshot: z.object({
        include: z.boolean().optional(),
        format: z.enum(['compact', 'full', 'diff', 'minimal']).optional(),
    }).optional(),
}, async (args) => {
    const result = await executePages(args);
    return {
        content: [{ type: 'text', text: JSON.stringify(result) }],
    };
});
// Handle process signals for cleanup
process.on('SIGINT', async () => {
    await browserManager.close();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await browserManager.close();
    process.exit(0);
});
// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    // Log to stderr (stdout is used for MCP communication)
    process.stderr.write('μBrowser MCP server started\n');
}
main().catch((error) => {
    process.stderr.write(`Fatal error: ${error}\n`);
    process.exit(1);
});
//# sourceMappingURL=index.js.map