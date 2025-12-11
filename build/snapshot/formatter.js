import { computeSnapshotHash, computeDiff, formatDiff } from './differ.js';
// Store the last snapshot for diff computation
let lastSnapshot = null;
// Format elements as HTML-style string (56% more token efficient than JSON)
export function formatElementsAsHTML(elements) {
    return elements.map(formatElement).join('\n');
}
// Format a single element
function formatElement(el) {
    const attrs = [`id="${el.id}"`];
    // Add role if not implied by tag
    if (el.role && !isRoleImpliedByTag(el.tag, el.role)) {
        attrs.push(`role="${el.role}"`);
    }
    // Add key attributes
    if (el.attributes) {
        const importantAttrs = ['type', 'href', 'placeholder', 'disabled', 'checked', 'required'];
        for (const attr of importantAttrs) {
            const value = el.attributes[attr];
            if (value !== undefined && value !== null && value !== '') {
                attrs.push(`${attr}="${value}"`);
            }
        }
    }
    const attrStr = attrs.join(' ');
    const content = el.name ? escapeHtml(truncate(el.name, 50)) : '';
    // Self-closing tags
    if (['input', 'img', 'br', 'hr'].includes(el.tag)) {
        return `<${el.tag} ${attrStr}>`;
    }
    // Empty content for some tags
    if (!content && ['div', 'span'].includes(el.tag)) {
        return `<${el.tag} ${attrStr}/>`;
    }
    return `<${el.tag} ${attrStr}>${content}</${el.tag}>`;
}
// Check if role is implied by tag
function isRoleImpliedByTag(tag, role) {
    const impliedRoles = {
        'button': 'button',
        'a': 'link',
        'input': 'textbox',
        'select': 'combobox',
        'textarea': 'textbox',
        'img': 'img',
        'nav': 'navigation',
        'main': 'main',
        'header': 'banner',
        'footer': 'contentinfo',
    };
    return impliedRoles[tag] === role;
}
// Escape HTML special characters
function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
// Truncate string
function truncate(str, maxLen) {
    if (str.length <= maxLen)
        return str;
    return str.substring(0, maxLen - 3) + '...';
}
// Create a full snapshot object
export function createSnapshot(url, title, elements) {
    const snapshot = {
        url,
        title,
        elements,
        hash: computeSnapshotHash(elements),
        timestamp: Date.now(),
    };
    // Store for future diff computation
    lastSnapshot = snapshot;
    return snapshot;
}
// Format snapshot based on requested format
export function formatSnapshot(elements, url, title, format = 'full') {
    if (format === 'minimal') {
        // Just element count and key stats
        const buttons = elements.filter(e => e.role === 'button').length;
        const links = elements.filter(e => e.role === 'link').length;
        const inputs = elements.filter(e => ['textbox', 'combobox', 'checkbox', 'radio'].includes(e.role)).length;
        return `Page: ${title}\nElements: ${elements.length} (${buttons} buttons, ${links} links, ${inputs} inputs)`;
    }
    if (format === 'diff') {
        const diff = computeDiff(lastSnapshot, elements);
        // Update last snapshot
        lastSnapshot = {
            url,
            title,
            elements,
            hash: computeSnapshotHash(elements),
            timestamp: Date.now(),
        };
        // If no previous snapshot or everything is new, fall back to full
        if (diff.unchanged === 0 && diff.modified.length === 0 && diff.removed.length === 0) {
            return formatFullSnapshot(elements, url, title);
        }
        return formatDiff(diff);
    }
    // Full format
    const snapshot = createSnapshot(url, title, elements);
    return formatFullSnapshot(elements, url, title);
}
// Format full snapshot
function formatFullSnapshot(elements, url, title) {
    const header = `Page: ${title}\nURL: ${url}\n---`;
    const body = formatElementsAsHTML(elements);
    return `${header}\n${body}`;
}
// Clear the last snapshot (e.g., on navigation)
export function clearSnapshotCache() {
    lastSnapshot = null;
}
// Get the last snapshot
export function getLastSnapshot() {
    return lastSnapshot;
}
//# sourceMappingURL=formatter.js.map