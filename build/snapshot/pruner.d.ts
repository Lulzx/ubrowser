import type { ElementRef } from '../types.js';
export declare function filterElements(elements: Array<{
    selector: string;
    role: string;
    name: string;
    tag: string;
    attributes: Record<string, string | number>;
}>, options?: {
    maxElements?: number;
}): ElementRef[];
export declare function collapseRepetitive(elements: ElementRef[], threshold?: number): ElementRef[];
//# sourceMappingURL=pruner.d.ts.map