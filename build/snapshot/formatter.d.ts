import type { ElementRef, PrunedSnapshot } from '../types.js';
export declare function formatElementsCompact(elements: ElementRef[]): string;
export declare function formatElementsAsHTML(elements: ElementRef[]): string;
export declare function createSnapshot(url: string, title: string, elements: ElementRef[]): PrunedSnapshot;
export type SnapshotFormat = 'compact' | 'full' | 'diff' | 'minimal';
export declare function formatSnapshot(elements: ElementRef[], url: string, title: string, format?: SnapshotFormat): string;
export declare function clearSnapshotCache(): void;
export declare function getLastSnapshot(): PrunedSnapshot | null;
//# sourceMappingURL=formatter.d.ts.map