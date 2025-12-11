import { createHash } from 'crypto';
// Compute hash of a snapshot for quick comparison
export function computeSnapshotHash(elements) {
    const content = elements
        .map(e => `${e.id}:${e.role}:${e.name}:${e.selector}`)
        .join('|');
    return createHash('md5').update(content).digest('hex').substring(0, 8);
}
// Compute diff between two snapshots
export function computeDiff(previous, current) {
    if (!previous) {
        // No previous snapshot, everything is new
        return {
            added: current,
            removed: [],
            modified: [],
            unchanged: 0,
        };
    }
    const prevMap = new Map();
    for (const el of previous.elements) {
        prevMap.set(el.id, el);
    }
    const currMap = new Map();
    for (const el of current) {
        currMap.set(el.id, el);
    }
    const added = [];
    const removed = [];
    const modified = [];
    let unchanged = 0;
    // Find added and modified elements
    for (const el of current) {
        const prev = prevMap.get(el.id);
        if (!prev) {
            added.push(el);
        }
        else {
            // Check if modified
            const changes = [];
            if (prev.name !== el.name)
                changes.push(`name: "${el.name}"`);
            if (prev.role !== el.role)
                changes.push(`role: ${el.role}`);
            if (changes.length > 0) {
                modified.push({ id: el.id, changes: changes.join(', ') });
            }
            else {
                unchanged++;
            }
        }
    }
    // Find removed elements
    for (const el of previous.elements) {
        if (!currMap.has(el.id)) {
            removed.push(el.id);
        }
    }
    return { added, removed, modified, unchanged };
}
// Format diff as a compact string
export function formatDiff(diff) {
    const lines = [];
    if (diff.added.length > 0) {
        lines.push(`+ Added ${diff.added.length} elements:`);
        for (const el of diff.added) {
            lines.push(formatElementAsHTML(el));
        }
    }
    if (diff.removed.length > 0) {
        lines.push(`- Removed: ${diff.removed.join(', ')}`);
    }
    if (diff.modified.length > 0) {
        lines.push(`~ Modified ${diff.modified.length} elements:`);
        for (const mod of diff.modified) {
            lines.push(`  ${mod.id}: ${mod.changes}`);
        }
    }
    if (diff.unchanged > 0) {
        lines.push(`= ${diff.unchanged} elements unchanged`);
    }
    return lines.join('\n');
}
// Format a single element as HTML-style string (token efficient)
function formatElementAsHTML(el) {
    const attrs = [`id="${el.id}"`];
    if (el.attributes) {
        for (const [key, value] of Object.entries(el.attributes)) {
            if (value && key !== 'value') { // Skip value to avoid leaking sensitive data
                attrs.push(`${key}="${value}"`);
            }
        }
    }
    const attrStr = attrs.join(' ');
    const content = el.name || '';
    // Self-closing for inputs
    if (el.tag === 'input') {
        return `<${el.tag} ${attrStr}>`;
    }
    return `<${el.tag} ${attrStr}>${content}</${el.tag}>`;
}
//# sourceMappingURL=differ.js.map