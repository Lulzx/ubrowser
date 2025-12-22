import { z } from 'zod';
import { type ExtractedElement } from '../snapshot/fast-extractor.js';
import { type ToolResponse } from '../types.js';
export declare const snapshotSchema: z.ZodObject<{
    scope: z.ZodOptional<z.ZodString>;
    format: z.ZodOptional<z.ZodEnum<["compact", "full", "diff", "minimal"]>>;
    maxElements: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    maxElements?: number | undefined;
    scope?: string | undefined;
    format?: "compact" | "full" | "diff" | "minimal" | undefined;
}, {
    maxElements?: number | undefined;
    scope?: string | undefined;
    format?: "compact" | "full" | "diff" | "minimal" | undefined;
}>;
export type SnapshotInput = z.infer<typeof snapshotSchema>;
export declare function executeSnapshot(input: SnapshotInput): Promise<ToolResponse>;
export declare function getLastSnapshotElements(): ExtractedElement[];
export declare function clearSnapshotElements(): void;
export declare const snapshotTool: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            scope: {
                type: string;
                description: string;
            };
            format: {
                type: string;
                enum: string[];
                description: string;
            };
            maxElements: {
                type: string;
                description: string;
            };
        };
        required: never[];
    };
};
//# sourceMappingURL=snapshot.d.ts.map