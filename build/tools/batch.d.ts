import { z } from 'zod';
export declare const batchSchema: z.ZodObject<{
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
    }, "strip", z.ZodTypeAny, {
        scope?: string | undefined;
        format?: "compact" | "full" | "diff" | undefined;
        when?: "never" | "final" | "each" | "on-error" | undefined;
    }, {
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
        scope?: string | undefined;
        format?: "compact" | "full" | "diff" | undefined;
        when?: "never" | "final" | "each" | "on-error" | undefined;
    } | undefined;
    stopOnError?: boolean | undefined;
}>;
export type BatchInput = z.infer<typeof batchSchema>;
interface BatchResult {
    ok: boolean;
    n?: number;
    err?: string;
    at?: number;
    snap?: string;
}
export declare function executeBatch(input: BatchInput): Promise<BatchResult>;
export declare const batchTool: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            steps: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        tool: {
                            type: string;
                            enum: string[];
                        };
                        args: {
                            type: string;
                        };
                    };
                    required: string[];
                };
                description: string;
            };
            snapshot: {
                type: string;
                properties: {
                    when: {
                        type: string;
                        enum: string[];
                        description: string;
                    };
                    scope: {
                        type: string;
                        description: string;
                    };
                    format: {
                        type: string;
                        enum: string[];
                        description: string;
                    };
                };
            };
            stopOnError: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
export {};
//# sourceMappingURL=batch.d.ts.map