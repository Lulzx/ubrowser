// Extract elements with their selectors using page evaluation
// This is the primary extraction method - uses direct DOM traversal
// which is more reliable and gives us proper selectors
export async function extractInteractiveElements(page, scope) {
    const scopeSelector = scope || 'body';
    const elements = await page.evaluate((scopeSel) => {
        const results = [];
        const interactiveTags = new Set(['a', 'button', 'input', 'select', 'textarea', 'details', 'summary']);
        const interactiveRoles = new Set([
            'button', 'link', 'textbox', 'combobox', 'listbox', 'option',
            'checkbox', 'radio', 'switch', 'slider', 'spinbutton', 'searchbox',
            'tab', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'treeitem'
        ]);
        function getSelector(el) {
            // Try ID first
            if (el.id) {
                return `#${CSS.escape(el.id)}`;
            }
            // Try data-testid
            const testId = el.getAttribute('data-testid');
            if (testId) {
                return `[data-testid="${CSS.escape(testId)}"]`;
            }
            // Try name attribute for form elements
            const name = el.getAttribute('name');
            if (name && ['input', 'select', 'textarea'].includes(el.tagName.toLowerCase())) {
                return `${el.tagName.toLowerCase()}[name="${CSS.escape(name)}"]`;
            }
            // Build a unique selector using tag + attributes + nth-child
            const tag = el.tagName.toLowerCase();
            const classes = Array.from(el.classList).slice(0, 2).map(c => `.${CSS.escape(c)}`).join('');
            const type = el.getAttribute('type');
            const typeAttr = type ? `[type="${type}"]` : '';
            let selector = `${tag}${classes}${typeAttr}`;
            // Add nth-of-type if needed for uniqueness
            const parent = el.parentElement;
            if (parent) {
                const siblings = Array.from(parent.querySelectorAll(`:scope > ${selector}`));
                if (siblings.length > 1) {
                    const index = siblings.indexOf(el) + 1;
                    selector = `${selector}:nth-of-type(${index})`;
                }
            }
            // If still not unique, add parent context
            if (document.querySelectorAll(selector).length > 1 && parent) {
                const parentSelector = getSelector(parent);
                selector = `${parentSelector} > ${selector}`;
            }
            return selector;
        }
        function getAccessibleName(el) {
            // Check aria-label
            const ariaLabel = el.getAttribute('aria-label');
            if (ariaLabel)
                return ariaLabel;
            // Check aria-labelledby
            const labelledBy = el.getAttribute('aria-labelledby');
            if (labelledBy) {
                const labelEl = document.getElementById(labelledBy);
                if (labelEl)
                    return labelEl.textContent?.trim() || '';
            }
            // Check for associated label (for form elements)
            if (el.id) {
                const label = document.querySelector(`label[for="${el.id}"]`);
                if (label)
                    return label.textContent?.trim() || '';
            }
            // Check title attribute
            const title = el.getAttribute('title');
            if (title)
                return title;
            // Check placeholder for inputs
            const placeholder = el.getAttribute('placeholder');
            if (placeholder)
                return placeholder;
            // Fall back to text content (truncated)
            const text = el.textContent?.trim() || '';
            return text.length > 50 ? text.substring(0, 47) + '...' : text;
        }
        function isVisible(el) {
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden')
                return false;
            if (el.getAttribute('aria-hidden') === 'true')
                return false;
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 && rect.height === 0)
                return false;
            return true;
        }
        function processElement(el) {
            if (!isVisible(el))
                return;
            const tag = el.tagName.toLowerCase();
            const role = el.getAttribute('role') || '';
            const isInteractive = interactiveTags.has(tag) ||
                interactiveRoles.has(role) ||
                el.hasAttribute('onclick') ||
                el.hasAttribute('tabindex') && el.getAttribute('tabindex') !== '-1';
            if (isInteractive) {
                const attributes = {};
                // Collect relevant attributes
                const attrNames = ['type', 'href', 'placeholder', 'value', 'checked', 'disabled', 'readonly', 'required'];
                for (const attr of attrNames) {
                    const val = el.getAttribute(attr);
                    if (val !== null) {
                        attributes[attr] = val;
                    }
                }
                results.push({
                    selector: getSelector(el),
                    role: role || getImplicitRole(el),
                    name: getAccessibleName(el),
                    tag,
                    attributes,
                });
            }
            // Process children
            for (const child of el.children) {
                processElement(child);
            }
        }
        function getImplicitRole(el) {
            const tag = el.tagName.toLowerCase();
            const type = el.getAttribute('type')?.toLowerCase();
            switch (tag) {
                case 'a': return el.hasAttribute('href') ? 'link' : '';
                case 'button': return 'button';
                case 'input':
                    switch (type) {
                        case 'button':
                        case 'submit':
                        case 'reset': return 'button';
                        case 'checkbox': return 'checkbox';
                        case 'radio': return 'radio';
                        case 'range': return 'slider';
                        case 'search': return 'searchbox';
                        default: return 'textbox';
                    }
                case 'select': return 'combobox';
                case 'textarea': return 'textbox';
                case 'img': return 'img';
                default: return '';
            }
        }
        const scopeEl = document.querySelector(scopeSel);
        if (scopeEl) {
            processElement(scopeEl);
        }
        return results;
    }, scopeSelector);
    return elements;
}
//# sourceMappingURL=extractor.js.map