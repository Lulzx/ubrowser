import { type Browser, type BrowserContext, type Page } from 'playwright';
declare class BrowserManager {
    private state;
    private namedPages;
    private currentPageName;
    initialize(): Promise<void>;
    getPage(name?: string): Promise<Page>;
    listPages(): string[];
    closePage(name: string): Promise<boolean>;
    switchPage(name: string): Promise<Page>;
    getCurrentPageName(): string;
    getContext(): Promise<BrowserContext>;
    getBrowser(): Promise<Browser>;
    close(): Promise<void>;
    isInitialized(): boolean;
}
export declare const browserManager: BrowserManager;
export {};
//# sourceMappingURL=manager.d.ts.map