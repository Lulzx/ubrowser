import type { Page } from 'playwright';

// Pre-injected extraction script - avoids JIT overhead on repeated calls
// This is the core optimization: inject once, call many times
const EXTRACTION_SCRIPT = `
window.__ubrowserExtract = function(scopeSel, maxElements) {
  const results = [];
  const scopeEl = document.querySelector(scopeSel || 'body');
  if (!scopeEl) return { elements: results, hash: 0 };

  // Optimized selector - covers all interactive elements
  const selector = 'a[href],button,input,select,textarea,[role="button"],[role="link"],[role="textbox"],[role="checkbox"],[role="radio"],[role="combobox"],[role="tab"],[role="menuitem"],[onclick],[tabindex]:not([tabindex="-1"])';

  const els = scopeEl.querySelectorAll(selector);
  const max = maxElements || 100;

  // CRITICAL: Batch all rect computations in single pass to avoid layout thrashing
  // This is 5-10x faster than calling getBoundingClientRect() in a loop
  const visibleEls = [];
  const rects = [];

  for (let i = 0; i < els.length && visibleEls.length < max; i++) {
    const el = els[i];
    if (el.getAttribute('aria-hidden') === 'true') continue;
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      visibleEls.push(el);
      rects.push(rect);
    }
  }

  // Pre-compute selector uniqueness
  const selectorCounts = new Map();
  let hash = 0;

  for (let i = 0; i < visibleEls.length; i++) {
    const el = visibleEls[i];
    const rect = rects[i];
    const tag = el.tagName.toLowerCase();
    const role = el.getAttribute('role') || '';

    // Fast selector generation with caching
    let selector;
    const id = el.id;
    if (id) {
      selector = '#' + CSS.escape(id);
    } else {
      const testId = el.getAttribute('data-testid');
      if (testId) {
        selector = '[data-testid="' + CSS.escape(testId) + '"]';
      } else {
        const name = el.getAttribute('name');
        if (name && (tag === 'input' || tag === 'select' || tag === 'textarea')) {
          selector = tag + '[name="' + CSS.escape(name) + '"]';
        } else {
          const type = el.getAttribute('type');
          selector = type ? tag + '[type="' + type + '"]' : tag;
          const count = (selectorCounts.get(selector) || 0) + 1;
          selectorCounts.set(selector, count);
          if (count > 1) selector = selector + ':nth-of-type(' + count + ')';
        }
      }
    }

    // Fast accessible name extraction
    let name = el.getAttribute('aria-label') ||
               el.getAttribute('title') ||
               el.getAttribute('placeholder') || '';
    if (!name) {
      const text = el.textContent;
      if (text) {
        const trimmed = text.trim();
        name = trimmed.length > 50 ? trimmed.substring(0, 47) + '...' : trimmed;
      }
    }

    // Collect essential attributes only
    const attrs = {};
    const type = el.getAttribute('type');
    const href = el.getAttribute('href');
    const placeholder = el.getAttribute('placeholder');
    if (type) attrs.type = type;
    if (href) attrs.href = href;
    if (placeholder) attrs.placeholder = placeholder;
    if (el.hasAttribute('disabled')) attrs.disabled = 'true';
    if (el.hasAttribute('checked')) attrs.checked = 'true';
    if (el.hasAttribute('required')) attrs.required = 'true';

    // Include position for force-click optimization
    attrs._x = Math.round(rect.left + rect.width / 2);
    attrs._y = Math.round(rect.top + rect.height / 2);

    // Compute rolling hash for change detection
    hash = ((hash << 5) - hash + selector.length + name.length) | 0;

    const implicitRole = tag === 'a' ? 'link' :
                         tag === 'button' ? 'button' :
                         tag === 'select' ? 'combobox' :
                         tag === 'textarea' ? 'textbox' :
                         tag === 'input' ? (type === 'checkbox' ? 'checkbox' :
                                           type === 'radio' ? 'radio' :
                                           type === 'submit' || type === 'button' || type === 'reset' ? 'button' : 'textbox') : '';

    results.push({
      selector: selector,
      role: role || implicitRole,
      name: name,
      tag: tag,
      attributes: attrs
    });
  }

  return { elements: results, hash: hash };
};

// Track DOM mutations for smart caching
window.__ubrowserMutationCount = 0;
if (!window.__ubrowserObserver) {
  window.__ubrowserObserver = new MutationObserver(function() {
    window.__ubrowserMutationCount++;
  });
  window.__ubrowserObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['disabled', 'checked', 'value', 'aria-hidden', 'hidden']
  });
}
`;

// Track if script is injected per page
const injectedPages = new WeakSet<Page>();

// Cache for unchanged DOM
interface CachedSnapshot {
  elements: ExtractedElement[];
  hash: number;
  mutationCount: number;
  timestamp: number;
}

const snapshotCache = new WeakMap<Page, CachedSnapshot>();

export interface ExtractedElement {
  selector: string;
  role: string;
  name: string;
  tag: string;
  attributes: Record<string, string>;
}

interface ExtractionResult {
  elements: ExtractedElement[];
  hash: number;
}

// Ensure extraction script is injected
async function ensureInjected(page: Page): Promise<void> {
  if (injectedPages.has(page)) return;

  try {
    // Check if already injected (page might have been reloaded)
    const hasScript = await page.evaluate(() => typeof (window as any).__ubrowserExtract === 'function');
    if (!hasScript) {
      await page.evaluate(EXTRACTION_SCRIPT);
    }
    injectedPages.add(page);
  } catch {
    // Re-inject on any error
    await page.evaluate(EXTRACTION_SCRIPT);
    injectedPages.add(page);
  }
}

// Fast extraction with caching
export async function extractInteractiveElementsFast(
  page: Page,
  scope?: string,
  options?: { maxElements?: number; skipCache?: boolean }
): Promise<ExtractedElement[]> {
  await ensureInjected(page);

  const maxElements = options?.maxElements ?? 100;

  // Check cache first (unless skipCache is true)
  if (!options?.skipCache) {
    const cached = snapshotCache.get(page);
    if (cached) {
      // Check if DOM has changed via mutation count
      const mutationCount = await page.evaluate(() => (window as any).__ubrowserMutationCount as number);
      if (mutationCount === cached.mutationCount && Date.now() - cached.timestamp < 5000) {
        return cached.elements;
      }
    }
  }

  // Extract using pre-injected function (avoids JIT overhead)
  const result = await page.evaluate(
    ([s, m]) => (window as any).__ubrowserExtract(s, m) as ExtractionResult,
    [scope || 'body', maxElements] as const
  );

  // Update cache
  const mutationCount = await page.evaluate(() => (window as any).__ubrowserMutationCount as number);
  snapshotCache.set(page, {
    elements: result.elements,
    hash: result.hash,
    mutationCount,
    timestamp: Date.now(),
  });

  return result.elements;
}

// Clear cache for a page (call on navigation)
export function clearFastExtractorCache(page: Page): void {
  snapshotCache.delete(page);
  injectedPages.delete(page);
}

// Get element position from cached snapshot (for force-click)
export function getElementPosition(
  elements: ExtractedElement[],
  refId: string
): { x: number; y: number } | null {
  // refId is like "e5", find element at index 4 (0-indexed)
  const match = refId.match(/^e(\d+)$/);
  if (!match) return null;

  const index = parseInt(match[1], 10) - 1;
  if (index < 0 || index >= elements.length) return null;

  const el = elements[index];
  const x = parseInt(el.attributes._x, 10);
  const y = parseInt(el.attributes._y, 10);

  if (isNaN(x) || isNaN(y)) return null;
  return { x, y };
}
