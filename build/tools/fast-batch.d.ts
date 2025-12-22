import { z } from 'zod';
export declare const fastBatchSchema: z.ZodObject<{
    steps: z.ZodArray<z.ZodObject<{
        tool: z.ZodEnum<["navigate", "click", "type", "select", "scroll", "wait"]>;
        args: z.ZodRecord<z.ZodString, z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        tool: "navigate" | "click" | "type" | "select" | "scroll" | "wait";
        args: Record<string, any>;
    }, {
        tool: "navigate" | "click" | "type" | "select" | "scroll" | "wait";
        args: Record<string, any>;
    }>, "many">;
    snapshot: z.ZodOptional<z.ZodObject<{
        when: z.ZodOptional<z.ZodEnum<["never", "final", "each", "on-error"]>>;
        scope: z.ZodOptional<z.ZodString>;
        format: z.ZodOptional<z.ZodEnum<["compact", "full", "diff"]>>;
        maxElements: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        maxElements?: number | undefined;
        scope?: string | undefined;
        format?: "compact" | "full" | "diff" | undefined;
        when?: "never" | "final" | "each" | "on-error" | undefined;
    }, {
        maxElements?: number | undefined;
        scope?: string | undefined;
        format?: "compact" | "full" | "diff" | undefined;
        when?: "never" | "final" | "each" | "on-error" | undefined;
    }>>;
    stopOnError: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    steps: {
        tool: "navigate" | "click" | "type" | "select" | "scroll" | "wait";
        args: Record<string, any>;
    }[];
    snapshot?: {
        maxElements?: number | undefined;
        scope?: string | undefined;
        format?: "compact" | "full" | "diff" | undefined;
        when?: "never" | "final" | "each" | "on-error" | undefined;
    } | undefined;
    stopOnError?: boolean | undefined;
}, {
    steps: {
        tool: "navigate" | "click" | "type" | "select" | "scroll" | "wait";
        args: Record<string, any>;
    }[];
    snapshot?: {
        maxElements?: number | undefined;
        scope?: string | undefined;
        format?: "compact" | "full" | "diff" | undefined;
        when?: "never" | "final" | "each" | "on-error" | undefined;
    } | undefined;
    stopOnError?: boolean | undefined;
}>;
export type FastBatchInput = z.infer<typeof fastBatchSchema>;
interface BatchResult {
    ok: boolean;
    n?: number;
    err?: string;
    at?: number;
    snap?: string;
}
export declare function executeFastBatch(input: FastBatchInput): Promise<BatchResult>;
export {};
//# sourceMappingURL=fast-batch.d.ts.map