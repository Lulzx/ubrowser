// Extract elements using optimized querySelectorAll (10x faster than recursive traversal)
export async function extractInteractiveElements(page, scope) {
    const scopeSelector = scope || 'body';
    const elements = await page.evaluate((scopeSel) => {
        const results = [];
        const scopeEl = document.querySelector(scopeSel);
        if (!scopeEl)
            return results;
        // Fast selector-based extraction (avoids recursive DOM walking)
        const interactiveSelector = 'a[href], button, input, select, textarea, [role="button"], [role="link"], [role="textbox"], [role="checkbox"], [role="radio"], [role="combobox"], [role="tab"], [role="menuitem"], [onclick], [tabindex]:not([tabindex="-1"])';
        const els = scopeEl.querySelectorAll(interactiveSelector);
        // Pre-compute selector uniqueness cache
        const selectorCounts = new Map();
        for (const el of els) {
            // Quick visibility check (skip expensive getComputedStyle when possible)
            if (el.getAttribute('aria-hidden') === 'true')
                continue;
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 && rect.height === 0)
                continue;
            const tag = el.tagName.toLowerCase();
            const role = el.getAttribute('role') || '';
            // Fast selector generation
            let selector;
            if (el.id) {
                selector = `#${CSS.escape(el.id)}`;
            }
            else {
                const testId = el.getAttribute('data-testid');
                if (testId) {
                    selector = `[data-testid="${CSS.escape(testId)}"]`;
                }
                else {
                    const name = el.getAttribute('name');
                    if (name && ['input', 'select', 'textarea'].includes(tag)) {
                        selector = `${tag}[name="${CSS.escape(name)}"]`;
                    }
                    else {
                        // Simple tag + type selector
                        const type = el.getAttribute('type');
                        selector = type ? `${tag}[type="${type}"]` : tag;
                        // Add nth-of-type only if needed
                        const count = (selectorCounts.get(selector) || 0) + 1;
                        selectorCounts.set(selector, count);
                        if (count > 1) {
                            selector = `${selector}:nth-of-type(${count})`;
                        }
                    }
                }
            }
            // Fast accessible name (most common cases first)
            let name = el.getAttribute('aria-label') ||
                el.getAttribute('title') ||
                el.getAttribute('placeholder') ||
                '';
            if (!name) {
                const text = el.textContent?.trim() || '';
                name = text.length > 50 ? text.substring(0, 47) + '...' : text;
            }
            // Collect only essential attributes
            const attributes = {};
            const type = el.getAttribute('type');
            const href = el.getAttribute('href');
            const placeholder = el.getAttribute('placeholder');
            const disabled = el.getAttribute('disabled');
            const checked = el.getAttribute('checked');
            const required = el.getAttribute('required');
            if (type)
                attributes.type = type;
            if (href)
                attributes.href = href;
            if (placeholder)
                attributes.placeholder = placeholder;
            if (disabled !== null)
                attributes.disabled = 'true';
            if (checked !== null)
                attributes.checked = 'true';
            if (required !== null)
                attributes.required = 'true';
            results.push({
                selector,
                role: role || getImplicitRole(tag, type),
                name,
                tag,
                attributes,
            });
            // Early exit at 100 elements
            if (results.length >= 100)
                break;
        }
        function getImplicitRole(tag, type) {
            if (tag === 'a')
                return 'link';
            if (tag === 'button')
                return 'button';
            if (tag === 'select')
                return 'combobox';
            if (tag === 'textarea')
                return 'textbox';
            if (tag === 'input') {
                if (type === 'checkbox')
                    return 'checkbox';
                if (type === 'radio')
                    return 'radio';
                if (type === 'submit' || type === 'button' || type === 'reset')
                    return 'button';
                return 'textbox';
            }
            return '';
        }
        return results;
    }, scopeSelector);
    return elements;
}
//# sourceMappingURL=extractor.js.map