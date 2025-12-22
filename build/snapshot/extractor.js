import { extractInteractiveElementsFast, clearFastExtractorCache } from './fast-extractor.js';
// Re-export fast extractor functions
export { clearFastExtractorCache };
// Extract elements using fast pre-injected script
// This is 5-10x faster than the previous implementation because:
// 1. Script is pre-injected and JIT-cached (avoids re-compilation)
// 2. getBoundingClientRect calls are batched (avoids layout thrashing)
// 3. MutationObserver caching (returns cached result if DOM unchanged)
export async function extractInteractiveElements(page, scope, options) {
    // Use the fast extractor with all optimizations
    const elements = await extractInteractiveElementsFast(page, scope, {
        maxElements: options?.maxElements,
    });
    // Filter out internal position attributes before returning
    return elements.map(el => ({
        selector: el.selector,
        role: el.role,
        name: el.name,
        tag: el.tag,
        attributes: Object.fromEntries(Object.entries(el.attributes)
            .filter(([k]) => !k.startsWith('_'))
            .map(([k, v]) => [k, String(v)])),
    }));
}
//# sourceMappingURL=extractor.js.map