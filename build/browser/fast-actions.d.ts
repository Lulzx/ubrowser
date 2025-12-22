import type { Page } from 'playwright';
export declare function fastClick(page: Page, x: number, y: number, options?: {
    button?: 'left' | 'right' | 'middle';
    clickCount?: number;
}): Promise<void>;
export declare function fastType(page: Page, text: string, options?: {
    clear?: boolean;
}): Promise<void>;
export declare function fastKeyPress(page: Page, key: string): Promise<void>;
export declare function fastScroll(page: Page, deltaX: number, deltaY: number, x?: number, y?: number): Promise<void>;
export declare function fastFocus(page: Page, x: number, y: number): Promise<void>;
export declare function cleanupCDPSession(page: Page): void;
//# sourceMappingURL=fast-actions.d.ts.map