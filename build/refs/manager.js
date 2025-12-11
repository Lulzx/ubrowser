// Element reference manager for stable refs across snapshots
class RefManager {
    refs = new Map();
    selectorToId = new Map();
    counter = 0;
    // Get or create a ref for an element
    getOrCreate(selector, role, name, tag, attributes) {
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
        const ref = {
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
    resolve(id) {
        return this.refs.get(id) ?? null;
    }
    // Get a Playwright locator for a ref
    async getLocator(page, refOrSelector) {
        // Check if it's a ref ID (starts with 'e' followed by numbers)
        if (/^e\d+$/.test(refOrSelector)) {
            const ref = this.resolve(refOrSelector);
            if (!ref) {
                throw new Error(`Unknown element ref: ${refOrSelector}`);
            }
            return page.locator(ref.selector);
        }
        // Otherwise treat it as a selector
        return page.locator(refOrSelector);
    }
    // Get all current refs
    getAll() {
        return Array.from(this.refs.values());
    }
    // Clear all refs (e.g., on navigation)
    clear() {
        this.refs.clear();
        this.selectorToId.clear();
        this.counter = 0;
    }
    // Remove specific refs by ID
    remove(ids) {
        for (const id of ids) {
            const ref = this.refs.get(id);
            if (ref) {
                this.selectorToId.delete(ref.selector);
                this.refs.delete(id);
            }
        }
    }
    // Get count of active refs
    count() {
        return this.refs.size;
    }
}
// Export singleton instance
export const refManager = new RefManager();
//# sourceMappingURL=manager.js.map