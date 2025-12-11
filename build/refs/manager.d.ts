import type { ElementRef } from '../types.js';
import type { Page, Locator } from 'playwright';
declare class RefManager {
    private refs;
    private selectorToId;
    private counter;
    getOrCreate(selector: string, role: string, name: string, tag: string, attributes?: Record<string, string>): string;
    resolve(id: string): ElementRef | null;
    getLocator(page: Page, refOrSelector: string, options?: {
        strict?: boolean;
    }): Promise<Locator>;
    getAll(): ElementRef[];
    clear(): void;
    remove(ids: string[]): void;
    count(): number;
}
export declare const refManager: RefManager;
export {};
//# sourceMappingURL=manager.d.ts.map