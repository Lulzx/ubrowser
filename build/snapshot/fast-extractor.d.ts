import type { Page } from 'playwright';
export interface ExtractedElement {
    selector: string;
    role: string;
    name: string;
    tag: string;
    attributes: Record<string, string | number>;
}
export declare function extractInteractiveElementsFast(page: Page, scope?: string, options?: {
    maxElements?: number;
    skipCache?: boolean;
}): Promise<ExtractedElement[]>;
export declare function clearFastExtractorCache(page: Page): void;
export declare function getElementPosition(elements: ExtractedElement[], refId: string): {
    x: number;
    y: number;
} | null;
//# sourceMappingURL=fast-extractor.d.ts.map