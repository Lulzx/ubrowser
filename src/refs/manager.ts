import type { ElementRef } from '../types.js';
import type { Page, Locator } from 'playwright';

// Element reference manager for stable refs across snapshots
class RefManager {
  private refs: Map<string, ElementRef> = new Map();
  private selectorToId: Map<string, string> = new Map();
  private counter: number = 0;

  // Get or create a ref for an element
  getOrCreate(
    selector: string,
    role: string,
    name: string,
    tag: string,
    attributes?: Record<string, string>
  ): string {
    // Check if we already have a ref for this selector
    const existingId = this.selectorToId.get(selector);
    if (existingId) {
      // Update the ref with latest info
      const ref = this.refs.get(existingId);
      if (ref) {
        ref.role = role;
        ref.name = name;
        ref.tag = tag;
        ref.attributes = attributes;
      }
      return existingId;
    }

    // Create new ref
    const id = `e${++this.counter}`;
    const ref: ElementRef = {
      id,
      selector,
      role,
      name,
      tag,
      attributes,
    };

    this.refs.set(id, ref);
    this.selectorToId.set(selector, id);
    return id;
  }

  // Resolve a ref ID to its ElementRef
  resolve(id: string): ElementRef | null {
    return this.refs.get(id) ?? null;
  }

  // Get a Playwright locator for a ref
  async getLocator(page: Page, refOrSelector: string, options?: { strict?: boolean }): Promise<Locator> {
    // Check if it's a ref ID (starts with 'e' followed by numbers)
    if (/^e\d+$/.test(refOrSelector)) {
      const ref = this.resolve(refOrSelector);
      if (!ref) {
        throw new Error(`Unknown element ref: ${refOrSelector}`);
      }
      return page.locator(ref.selector);
    }

    // Handle text-based selectors with fallback strategies
    // Convert :has-text() to getByRole/getByText for better reliability
    const hasTextMatch = refOrSelector.match(/^(.+):has-text\(['"](.+)['"]\)$/);
    if (hasTextMatch) {
      const [, baseSelector, text] = hasTextMatch;
      // Try exact match first, then case-insensitive
      const locator = page.locator(baseSelector).filter({ hasText: new RegExp(text, 'i') });
      return locator.first();
    }

    // For role-based selectors with text, use getByRole for better reliability
    const roleTextMatch = refOrSelector.match(/^\[role=['"](\w+)['"]\]:has-text\(['"](.+)['"]\)$/);
    if (roleTextMatch) {
      const [, role, text] = roleTextMatch;
      return page.getByRole(role as any, { name: new RegExp(text, 'i') }).first();
    }

    // Otherwise treat it as a selector
    const locator = page.locator(refOrSelector);
    // Return first match to avoid strict mode issues with multiple matches
    return options?.strict === false ? locator.first() : locator;
  }

  // Get all current refs
  getAll(): ElementRef[] {
    return Array.from(this.refs.values());
  }

  // Clear all refs (e.g., on navigation)
  clear(): void {
    this.refs.clear();
    this.selectorToId.clear();
    this.counter = 0;
  }

  // Remove specific refs by ID
  remove(ids: string[]): void {
    for (const id of ids) {
      const ref = this.refs.get(id);
      if (ref) {
        this.selectorToId.delete(ref.selector);
        this.refs.delete(id);
      }
    }
  }

  // Get count of active refs
  count(): number {
    return this.refs.size;
  }
}

// Export singleton instance
export const refManager = new RefManager();
