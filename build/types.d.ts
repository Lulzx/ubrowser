import type { Browser, BrowserContext, Page } from 'playwright';
export interface ElementRef {
    id: string;
    selector: string;
    role: string;
    name: string;
    tag: string;
    attributes?: Record<string, string>;
}
export interface PrunedSnapshot {
    url: string;
    title: string;
    elements: ElementRef[];
    hash: string;
    timestamp: number;
}
export interface SnapshotDiff {
    added: ElementRef[];
    removed: string[];
    modified: Array<{
        id: string;
        changes: string;
    }>;
    unchanged: number;
}
export interface ToolResponse {
    ok: boolean;
    snapshot?: string;
    error?: string;
    url?: string;
    title?: string;
}
export interface SnapshotOptions {
    include?: boolean;
    scope?: string;
    format?: 'compact' | 'full' | 'diff' | 'minimal';
}
export interface ToolOptions {
    snapshot?: SnapshotOptions;
    timeout?: number;
}
export interface BatchStep {
    tool: 'navigate' | 'click' | 'type' | 'select' | 'scroll' | 'wait';
    args: Record<string, unknown>;
}
export interface BatchSnapshotOptions {
    when: 'never' | 'final' | 'each' | 'on-error';
    scope?: string;
    format?: 'compact' | 'full' | 'diff';
}
export interface BrowserState {
    browser: Browser | null;
    context: BrowserContext | null;
    page: Page | null;
    initialized: boolean;
}
export declare const INTERACTIVE_ROLES: Set<string>;
export declare const NON_INTERACTIVE_ROLES: Set<string>;
export declare const INTERACTIVE_TAGS: Set<string>;
export declare function cleanError(error: unknown): string;
//# sourceMappingURL=types.d.ts.map