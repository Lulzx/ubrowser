import { z } from 'zod';
import { type ToolResponse } from '../types.js';
export declare const scrollSchema: z.ZodObject<{
    ref: z.ZodOptional<z.ZodString>;
    selector: z.ZodOptional<z.ZodString>;
    direction: z.ZodOptional<z.ZodEnum<["up", "down", "left", "right"]>>;
    amount: z.ZodOptional<z.ZodNumber>;
    toTop: z.ZodOptional<z.ZodBoolean>;
    toBottom: z.ZodOptional<z.ZodBoolean>;
    snapshot: z.ZodOptional<z.ZodObject<{
        include: z.ZodOptional<z.ZodBoolean>;
        scope: z.ZodOptional<z.ZodString>;
        format: z.ZodOptional<z.ZodEnum<["compact", "full", "diff", "minimal"]>>;
    }, "strip", z.ZodTypeAny, {
        include?: boolean | undefined;
        scope?: string | undefined;
        format?: "compact" | "full" | "diff" | "minimal" | undefined;
    }, {
        include?: boolean | undefined;
        scope?: string | undefined;
        format?: "compact" | "full" | "diff" | "minimal" | undefined;
    }>>;
    timeout: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    snapshot?: {
        include?: boolean | undefined;
        scope?: string | undefined;
        format?: "compact" | "full" | "diff" | "minimal" | undefined;
    } | undefined;
    timeout?: number | undefined;
    ref?: string | undefined;
    selector?: string | undefined;
    direction?: "left" | "right" | "up" | "down" | undefined;
    amount?: number | undefined;
    toTop?: boolean | undefined;
    toBottom?: boolean | undefined;
}, {
    snapshot?: {
        include?: boolean | undefined;
        scope?: string | undefined;
        format?: "compact" | "full" | "diff" | "minimal" | undefined;
    } | undefined;
    timeout?: number | undefined;
    ref?: string | undefined;
    selector?: string | undefined;
    direction?: "left" | "right" | "up" | "down" | undefined;
    amount?: number | undefined;
    toTop?: boolean | undefined;
    toBottom?: boolean | undefined;
}>;
export type ScrollInput = z.infer<typeof scrollSchema>;
export declare function executeScroll(input: ScrollInput): Promise<ToolResponse>;
export declare const scrollTool: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            ref: {
                type: string;
                description: string;
            };
            selector: {
                type: string;
                description: string;
            };
            direction: {
                type: string;
                enum: string[];
                description: string;
            };
            amount: {
                type: string;
                description: string;
            };
            toTop: {
                type: string;
                description: string;
            };
            toBottom: {
                type: string;
                description: string;
            };
            snapshot: {
                type: string;
                properties: {
                    include: {
                        type: string;
                    };
                    scope: {
                        type: string;
                    };
                    format: {
                        type: string;
                        enum: string[];
                    };
                };
            };
            timeout: {
                type: string;
            };
        };
        required: never[];
    };
};
//# sourceMappingURL=scroll.d.ts.map