import { refManager } from '../refs/manager.js';
// Filter elements array (from extractInteractiveElements)
// This is the main function used by all tools
export function filterElements(elements, options = {}) {
    const maxElements = options.maxElements ?? 100;
    const refs = [];
    for (const el of elements.slice(0, maxElements)) {
        const id = refManager.getOrCreate(el.selector, el.role, el.name, el.tag, el.attributes);
        refs.push({
            id,
            selector: el.selector,
            role: el.role,
            name: el.name,
            tag: el.tag,
            attributes: el.attributes,
        });
    }
    return refs;
}
// Collapse repetitive elements (e.g., long lists)
export function collapseRepetitive(elements, threshold = 5) {
    // Group elements by tag+role pattern
    const groups = new Map();
    for (const el of elements) {
        const key = `${el.tag}:${el.role}`;
        const group = groups.get(key) || [];
        group.push(el);
        groups.set(key, group);
    }
    const result = [];
    const collapsed = new Set();
    for (const el of elements) {
        const key = `${el.tag}:${el.role}`;
        const group = groups.get(key);
        if (group.length > threshold && !collapsed.has(key)) {
            // Keep first 3, collapse the rest
            const kept = group.slice(0, 3);
            result.push(...kept);
            // Add a summary element
            result.push({
                id: `${key}-summary`,
                selector: '',
                role: 'note',
                name: `... and ${group.length - 3} more ${el.tag} elements`,
                tag: 'span',
            });
            collapsed.add(key);
        }
        else if (!collapsed.has(key) || group.length <= threshold) {
            // Keep if not part of a collapsed group
            if (group.length <= threshold) {
                result.push(el);
            }
        }
    }
    return result;
}
//# sourceMappingURL=pruner.js.map