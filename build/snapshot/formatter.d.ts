import type { ElementRef, PrunedSnapshot } from '../types.js';
export declare function formatElementsAsHTML(elements: ElementRef[]): string;
export declare function createSnapshot(url: string, title: string, elements: ElementRef[]): PrunedSnapshot;
export declare function formatSnapshot(elements: ElementRef[], url: string, title: string, format?: 'full' | 'diff' | 'minimal'): string;
export declare function clearSnapshotCache(): void;
export declare function getLastSnapshot(): PrunedSnapshot | null;
//# sourceMappingURL=formatter.d.ts.map