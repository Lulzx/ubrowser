import { computeSnapshotHash, computeDiff, formatDiff } from './differ.js';
// Store the last snapshot for diff computation
let lastSnapshot = null;
// Tag abbreviations for ultra-compact format
const TAG_ABBREV = {
    'button': 'btn',
    'input': 'inp',
    'select': 'sel',
    'textarea': 'txt',
    'a': 'a',
    'div': 'div',
    'span': 'sp',
    'label': 'lbl',
    'img': 'img',
    'form': 'frm',
};
// Format elements in ultra-compact notation (70%+ more efficient than HTML)
// Format: tag#ref@type~placeholder/href"content"
// Examples:
//   btn#e1"Submit"
//   inp#e2@email~"Email"
//   a#e3/login"Sign in"
//   sel#e4"Country"
export function formatElementsCompact(elements) {
    return elements.map(formatElementCompact).join('\n');
}
// Format single element in ultra-compact notation
function formatElementCompact(el) {
    const tag = TAG_ABBREV[el.tag] || el.tag;
    let result = `${tag}#${el.id}`;
    // Add type for inputs (common pattern)
    if (el.attributes?.type && el.tag === 'input') {
        const t = el.attributes.type;
        // Abbreviate common types
        const typeAbbrev = {
            'text': 't', 'email': 'e', 'password': 'p', 'number': 'n',
            'checkbox': 'c', 'radio': 'r', 'submit': 's', 'button': 'b',
        };
        result += `@${typeAbbrev[t] || t}`;
    }
    // Add placeholder hint
    if (el.attributes?.placeholder) {
        result += `~"${truncate(el.attributes.placeholder, 20)}"`;
    }
    // Add href for links
    if (el.attributes?.href) {
        const href = el.attributes.href;
        // Shorten relative URLs
        result += `/${href.replace(/^https?:\/\/[^\/]+/, '').replace(/^\//, '')}`;
    }
    // Add content/name
    if (el.name) {
        result += `"${truncate(el.name, 30)}"`;
    }
    // Add state indicators
    if (el.attributes?.disabled)
        result += '!d';
    if (el.attributes?.checked)
        result += '!c';
    if (el.attributes?.required)
        result += '!r';
    return result;
}
// Format elements as HTML-style string (fallback, 56% more token efficient than JSON)
export function formatElementsAsHTML(elements) {
    return elements.map(formatElement).join('\n');
}
// Format a single element (HTML style)
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
// Default changed to 'compact' for 70%+ token savings
export function formatSnapshot(elements, url, title, format = 'compact') {
    if (format === 'minimal') {
        // Ultra-minimal: just counts
        const b = elements.filter(e => e.role === 'button').length;
        const l = elements.filter(e => e.role === 'link').length;
        const i = elements.filter(e => ['textbox', 'combobox', 'checkbox', 'radio'].includes(e.role)).length;
        return `${title}|${elements.length}els|${b}btn|${l}lnk|${i}inp`;
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
        // If no previous snapshot or everything is new, fall back to compact
        if (diff.unchanged === 0 && diff.modified.length === 0 && diff.removed.length === 0) {
            return formatCompactSnapshot(elements, url, title);
        }
        return formatDiff(diff);
    }
    if (format === 'full') {
        // HTML format (legacy, for debugging)
        const snapshot = createSnapshot(url, title, elements);
        return formatFullSnapshot(elements, url, title);
    }
    // Default: compact format (70%+ token savings)
    const snapshot = createSnapshot(url, title, elements);
    return formatCompactSnapshot(elements, url, title);
}
// Format compact snapshot (default - most efficient)
function formatCompactSnapshot(elements, url, title) {
    // Short header
    const shortUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const header = `[${title}](${shortUrl})`;
    const body = formatElementsCompact(elements);
    return `${header}\n${body}`;
}
// Format full snapshot (HTML style - legacy)
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