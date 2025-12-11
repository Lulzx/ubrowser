import type { Page } from 'playwright';
export declare function extractInteractiveElements(page: Page, scope?: string): Promise<Array<{
    selector: string;
    role: string;
    name: string;
    tag: string;
    attributes: Record<string, string>;
}>>;
//# sourceMappingURL=extractor.d.ts.map