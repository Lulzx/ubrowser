import type { Page } from 'playwright';
import { clearFastExtractorCache } from './fast-extractor.js';
export { clearFastExtractorCache };
export declare function extractInteractiveElements(page: Page, scope?: string, options?: {
    maxElements?: number;
}): Promise<Array<{
    selector: string;
    role: string;
    name: string;
    tag: string;
    attributes: Record<string, string>;
}>>;
//# sourceMappingURL=extractor.d.ts.map