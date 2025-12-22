import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { BrowserState } from '../types.js';

// Console message interface
export interface ConsoleMessage {
  type: string;
  text: string;
  timestamp: number;
  url?: string;
  line?: number;
}

// Network request interface
export interface NetworkRequest {
  id: string;
  url: string;
  method: string;
  resourceType: string;
  timestamp: number;
  status?: number;
  statusText?: string;
  responseTime?: number;
  failed?: boolean;
  failureText?: string;
}

// Singleton browser manager for efficient resource usage
// Now with named pages support for multi-page workflows
class BrowserManager {
  private state: BrowserState = {
    browser: null,
    context: null,
    page: null,
    initialized: false,
  };

  // Named pages for persistent multi-page workflows
  private namedPages: Map<string, Page> = new Map();
  private currentPageName: string = 'default';

  // Console and network capture
  private consoleMessages: ConsoleMessage[] = [];
  private networkRequests: NetworkRequest[] = [];
  private pendingRequests: Map<string, NetworkRequest> = new Map();
  private readonly CONSOLE_LIMIT = parseInt(process.env.UBROWSER_CONSOLE_LIMIT || '100', 10);
  private readonly NETWORK_LIMIT = parseInt(process.env.UBROWSER_NETWORK_LIMIT || '100', 10);

  async initialize(): Promise<void> {
    if (this.state.initialized) return;

    const blockStylesheets = ['1', 'true'].includes(
      (process.env.UBROWSER_BLOCK_STYLESHEETS || '').toLowerCase()
    );

    // Use persistent context for session persistence (cookies, localStorage, etc.)
    const profileDir = process.env.UBROWSER_PROFILE_DIR || join(homedir(), '.ubrowser', 'profile');
    mkdirSync(profileDir, { recursive: true });

    this.state.context = await chromium.launchPersistentContext(profileDir, {
      headless: true,
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    // Browser may be null with persistent context
    this.state.browser = this.state.context.browser();

    // Block unnecessary resources for faster page loads
    await this.state.context.route('**/*', (route) => {
      const resourceType = route.request().resourceType();
      // Block images, fonts, media (keep stylesheets - some sites need them for layout)
      if (['image', 'font', 'media'].includes(resourceType)) {
        return route.abort();
      }
      if (blockStylesheets && resourceType === 'stylesheet') {
        return route.abort();
      }
      return route.continue();
    });

    // Get existing page or create new one
    const pages = this.state.context.pages();
    this.state.page = pages.length > 0 ? pages[0] : await this.state.context.newPage();
    this.setupPageHandlers(this.state.page);
    this.namedPages.set('default', this.state.page);
    this.state.initialized = true;
  }

  // Setup console and network handlers for a page
  private setupPageHandlers(page: Page): void {
    // Console message capture
    page.on('console', (msg) => {
      this.consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: Date.now(),
        url: msg.location().url || undefined,
        line: msg.location().lineNumber || undefined,
      });
      // Ring buffer - keep only last N messages
      while (this.consoleMessages.length > this.CONSOLE_LIMIT) {
        this.consoleMessages.shift();
      }
    });

    // Network request capture
    page.on('request', (req) => {
      const id = `${req.url()}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const request: NetworkRequest = {
        id,
        url: req.url(),
        method: req.method(),
        resourceType: req.resourceType(),
        timestamp: Date.now(),
      };
      this.pendingRequests.set(req.url() + req.method(), request);
    });

    page.on('response', (res) => {
      const key = res.url() + res.request().method();
      const pending = this.pendingRequests.get(key);
      if (pending) {
        pending.status = res.status();
        pending.statusText = res.statusText();
        pending.responseTime = Date.now() - pending.timestamp;
        this.networkRequests.push(pending);
        this.pendingRequests.delete(key);
        // Ring buffer
        while (this.networkRequests.length > this.NETWORK_LIMIT) {
          this.networkRequests.shift();
        }
      }
    });

    page.on('requestfailed', (req) => {
      const key = req.url() + req.method();
      const pending = this.pendingRequests.get(key);
      if (pending) {
        pending.failed = true;
        pending.failureText = req.failure()?.errorText;
        pending.responseTime = Date.now() - pending.timestamp;
        this.networkRequests.push(pending);
        this.pendingRequests.delete(key);
        // Ring buffer
        while (this.networkRequests.length > this.NETWORK_LIMIT) {
          this.networkRequests.shift();
        }
      }
    });
  }

  // Get or create a named page
  async getPage(name?: string): Promise<Page> {
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
    this.setupPageHandlers(newPage);
    this.namedPages.set(pageName, newPage);
    this.currentPageName = pageName;
    this.state.page = newPage;

    return newPage;
  }

  // List all named pages
  listPages(): string[] {
    const activePages: string[] = [];
    for (const [name, page] of this.namedPages) {
      if (!page.isClosed()) {
        activePages.push(name);
      }
    }
    return activePages;
  }

  // Close a named page
  async closePage(name: string): Promise<boolean> {
    const page = this.namedPages.get(name);
    if (page && !page.isClosed()) {
      await page.close();
      this.namedPages.delete(name);

      // If we closed the current page, switch to default or first available
      if (this.currentPageName === name) {
        const remaining = this.listPages();
        if (remaining.length > 0) {
          this.currentPageName = remaining[0];
          this.state.page = this.namedPages.get(this.currentPageName)!;
        } else {
          // Create a new default page
          if (this.state.context) {
            this.state.page = await this.state.context.newPage();
            this.setupPageHandlers(this.state.page);
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
  async switchPage(name: string): Promise<Page> {
    return this.getPage(name);
  }

  // Get current page name
  getCurrentPageName(): string {
    return this.currentPageName;
  }

  async getContext(): Promise<BrowserContext> {
    await this.initialize();
    if (!this.state.context) {
      throw new Error('Context not initialized');
    }
    return this.state.context;
  }

  async getBrowser(): Promise<Browser | null> {
    await this.initialize();
    return this.state.browser;
  }

  // Console message methods
  getConsoleMessages(filter?: string, limit?: number): ConsoleMessage[] {
    let messages = [...this.consoleMessages];
    if (filter && filter !== 'all') {
      messages = messages.filter(m => m.type === filter);
    }
    if (limit) {
      messages = messages.slice(-limit);
    }
    return messages;
  }

  clearConsoleMessages(): void {
    this.consoleMessages = [];
  }

  // Network request methods
  getNetworkRequests(urlFilter?: string, limit?: number): NetworkRequest[] {
    let requests = [...this.networkRequests];
    if (urlFilter) {
      const pattern = new RegExp(urlFilter.replace(/\*/g, '.*'));
      requests = requests.filter(r => pattern.test(r.url));
    }
    if (limit) {
      requests = requests.slice(-limit);
    }
    return requests;
  }

  clearNetworkRequests(): void {
    this.networkRequests = [];
    this.pendingRequests.clear();
  }

  async close(): Promise<void> {
    // Close all named pages
    for (const [name, page] of this.namedPages) {
      if (!page.isClosed()) {
        await page.close().catch(() => {});
      }
    }
    this.namedPages.clear();

    // With persistent context, closing context also closes browser
    if (this.state.context) {
      await this.state.context.close().catch(() => {});
    }

    this.state = {
      browser: null,
      context: null,
      page: null,
      initialized: false,
    };
    this.currentPageName = 'default';
    this.consoleMessages = [];
    this.networkRequests = [];
    this.pendingRequests.clear();
  }

  isInitialized(): boolean {
    return this.state.initialized;
  }
}

// Export singleton instance
export const browserManager = new BrowserManager();
