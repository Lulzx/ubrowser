import { chromium } from 'playwright';
// Singleton browser manager for efficient resource usage
// Now with named pages support for multi-page workflows
class BrowserManager {
    state = {
        browser: null,
        context: null,
        page: null,
        initialized: false,
    };
    // Named pages for persistent multi-page workflows
    namedPages = new Map();
    currentPageName = 'default';
    async initialize() {
        if (this.state.initialized)
            return;
        this.state.browser = await chromium.launch({
            headless: true,
        });
        this.state.context = await this.state.browser.newContext({
            viewport: { width: 1280, height: 720 },
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        });
        // Block unnecessary resources for faster page loads
        await this.state.context.route('**/*', (route) => {
            const resourceType = route.request().resourceType();
            // Block images, fonts, media (keep stylesheets - some sites need them for layout)
            if (['image', 'font', 'media'].includes(resourceType)) {
                return route.abort();
            }
            return route.continue();
        });
        this.state.page = await this.state.context.newPage();
        this.namedPages.set('default', this.state.page);
        this.state.initialized = true;
    }
    // Get or create a named page
    async getPage(name) {
        await this.initialize();
        const pageName = name || this.currentPageName;
        // Check if page exists and is not closed
        const existingPage = this.namedPages.get(pageName);
        if (existingPage && !existingPage.isClosed()) {
            this.currentPageName = pageName;
            this.state.page = existingPage;
            return existingPage;
        }
        // Create new page if doesn't exist
        if (!this.state.context) {
            throw new Error('Context not initialized');
        }
        const newPage = await this.state.context.newPage();
        this.namedPages.set(pageName, newPage);
        this.currentPageName = pageName;
        this.state.page = newPage;
        return newPage;
    }
    // List all named pages
    listPages() {
        const activePages = [];
        for (const [name, page] of this.namedPages) {
            if (!page.isClosed()) {
                activePages.push(name);
            }
        }
        return activePages;
    }
    // Close a named page
    async closePage(name) {
        const page = this.namedPages.get(name);
        if (page && !page.isClosed()) {
            await page.close();
            this.namedPages.delete(name);
            // If we closed the current page, switch to default or first available
            if (this.currentPageName === name) {
                const remaining = this.listPages();
                if (remaining.length > 0) {
                    this.currentPageName = remaining[0];
                    this.state.page = this.namedPages.get(this.currentPageName);
                }
                else {
                    // Create a new default page
                    if (this.state.context) {
                        this.state.page = await this.state.context.newPage();
                        this.namedPages.set('default', this.state.page);
                        this.currentPageName = 'default';
                    }
                }
            }
            return true;
        }
        return false;
    }
    // Switch to a named page
    async switchPage(name) {
        return this.getPage(name);
    }
    // Get current page name
    getCurrentPageName() {
        return this.currentPageName;
    }
    async getContext() {
        await this.initialize();
        if (!this.state.context) {
            throw new Error('Context not initialized');
        }
        return this.state.context;
    }
    async getBrowser() {
        await this.initialize();
        if (!this.state.browser) {
            throw new Error('Browser not initialized');
        }
        return this.state.browser;
    }
    async close() {
        // Close all named pages
        for (const [name, page] of this.namedPages) {
            if (!page.isClosed()) {
                await page.close().catch(() => { });
            }
        }
        this.namedPages.clear();
        if (this.state.context) {
            await this.state.context.close().catch(() => { });
        }
        if (this.state.browser) {
            await this.state.browser.close().catch(() => { });
        }
        this.state = {
            browser: null,
            context: null,
            page: null,
            initialized: false,
        };
        this.currentPageName = 'default';
    }
    isInitialized() {
        return this.state.initialized;
    }
}
// Export singleton instance
export const browserManager = new BrowserManager();
//# sourceMappingURL=manager.js.map