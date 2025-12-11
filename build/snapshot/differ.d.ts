import type { ElementRef, SnapshotDiff, PrunedSnapshot } from '../types.js';
export declare function computeSnapshotHash(elements: ElementRef[]): string;
export declare function computeDiff(previous: PrunedSnapshot | null, current: ElementRef[]): SnapshotDiff;
export declare function formatDiff(diff: SnapshotDiff): string;
//# sourceMappingURL=differ.d.ts.map