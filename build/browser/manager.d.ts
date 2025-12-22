import { type Browser, type BrowserContext, type Page } from 'playwright';
export interface ConsoleMessage {
    type: string;
    text: string;
    timestamp: number;
    url?: string;
    line?: number;
}
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
declare class BrowserManager {
    private state;
    private namedPages;
    private currentPageName;
    private consoleMessages;
    private networkRequests;
    private pendingRequests;
    private readonly CONSOLE_LIMIT;
    private readonly NETWORK_LIMIT;
    initialize(): Promise<void>;
    private setupPageHandlers;
    getPage(name?: string): Promise<Page>;
    listPages(): string[];
    closePage(name: string): Promise<boolean>;
    switchPage(name: string): Promise<Page>;
    getCurrentPageName(): string;
    getContext(): Promise<BrowserContext>;
    getBrowser(): Promise<Browser | null>;
    getConsoleMessages(filter?: string, limit?: number): ConsoleMessage[];
    clearConsoleMessages(): void;
    getNetworkRequests(urlFilter?: string, limit?: number): NetworkRequest[];
    clearNetworkRequests(): void;
    close(): Promise<void>;
    isInitialized(): boolean;
}
export declare const browserManager: BrowserManager;
export {};
//# sourceMappingURL=manager.d.ts.map