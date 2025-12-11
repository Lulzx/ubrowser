// Tool registry - exports all tools and their handlers
export { navigateTool, executeNavigate } from './navigate.js';
export { clickTool, executeClick } from './click.js';
export { typeTool, executeType } from './type.js';
export { selectTool, executeSelect } from './select.js';
export { scrollTool, executeScroll } from './scroll.js';
export { snapshotTool, executeSnapshot } from './snapshot.js';
export { batchTool, executeBatch } from './batch.js';
export { inspectTool, executeInspect } from './inspect.js';
export { pagesTool, executePages } from './pages.js';
// All tool definitions for MCP registration
export const allTools = [
    { name: 'browser_navigate', module: 'navigate' },
    { name: 'browser_click', module: 'click' },
    { name: 'browser_type', module: 'type' },
    { name: 'browser_select', module: 'select' },
    { name: 'browser_scroll', module: 'scroll' },
    { name: 'browser_snapshot', module: 'snapshot' },
    { name: 'browser_batch', module: 'batch' },
    { name: 'browser_inspect', module: 'inspect' },
    { name: 'browser_pages', module: 'pages' },
];
//# sourceMappingURL=index.js.map