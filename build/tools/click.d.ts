import { z } from 'zod';
import type { ToolResponse } from '../types.js';
export declare const clickSchema: z.ZodEffects<z.ZodObject<{
    ref: z.ZodOptional<z.ZodString>;
    selector: z.ZodOptional<z.ZodString>;
    button: z.ZodOptional<z.ZodEnum<["left", "right", "middle"]>>;
    clickCount: z.ZodOptional<z.ZodNumber>;
    snapshot: z.ZodOptional<z.ZodObject<{
        include: z.ZodOptional<z.ZodBoolean>;
        scope: z.ZodOptional<z.ZodString>;
        format: z.ZodOptional<z.ZodEnum<["full", "diff", "minimal"]>>;
    }, "strip", z.ZodTypeAny, {
        include?: boolean | undefined;
        scope?: string | undefined;
        format?: "full" | "diff" | "minimal" | undefined;
    }, {
        include?: boolean | undefined;
        scope?: string | undefined;
        format?: "full" | "diff" | "minimal" | undefined;
    }>>;
    timeout: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    button?: "left" | "right" | "middle" | undefined;
    snapshot?: {
        include?: boolean | undefined;
        scope?: string | undefined;
        format?: "full" | "diff" | "minimal" | undefined;
    } | undefined;
    timeout?: number | undefined;
    ref?: string | undefined;
    selector?: string | undefined;
    clickCount?: number | undefined;
}, {
    button?: "left" | "right" | "middle" | undefined;
    snapshot?: {
        include?: boolean | undefined;
        scope?: string | undefined;
        format?: "full" | "diff" | "minimal" | undefined;
    } | undefined;
    timeout?: number | undefined;
    ref?: string | undefined;
    selector?: string | undefined;
    clickCount?: number | undefined;
}>, {
    button?: "left" | "right" | "middle" | undefined;
    snapshot?: {
        include?: boolean | undefined;
        scope?: string | undefined;
        format?: "full" | "diff" | "minimal" | undefined;
    } | undefined;
    timeout?: number | undefined;
    ref?: string | undefined;
    selector?: string | undefined;
    clickCount?: number | undefined;
}, {
    button?: "left" | "right" | "middle" | undefined;
    snapshot?: {
        include?: boolean | undefined;
        scope?: string | undefined;
        format?: "full" | "diff" | "minimal" | undefined;
    } | undefined;
    timeout?: number | undefined;
    ref?: string | undefined;
    selector?: string | undefined;
    clickCount?: number | undefined;
}>;
export type ClickInput = z.infer<typeof clickSchema>;
export declare function executeClick(input: ClickInput): Promise<ToolResponse>;
export declare const clickTool: {
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
            button: {
                type: string;
                enum: string[];
                description: string;
            };
            clickCount: {
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
//# sourceMappingURL=click.d.ts.map