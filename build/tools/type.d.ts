import { z } from 'zod';
import { type ToolResponse } from '../types.js';
export declare const typeSchema: z.ZodEffects<z.ZodObject<{
    ref: z.ZodOptional<z.ZodString>;
    selector: z.ZodOptional<z.ZodString>;
    text: z.ZodString;
    clear: z.ZodOptional<z.ZodBoolean>;
    pressEnter: z.ZodOptional<z.ZodBoolean>;
    delay: z.ZodOptional<z.ZodNumber>;
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
    text: string;
    snapshot?: {
        include?: boolean | undefined;
        scope?: string | undefined;
        format?: "compact" | "full" | "diff" | "minimal" | undefined;
    } | undefined;
    timeout?: number | undefined;
    ref?: string | undefined;
    selector?: string | undefined;
    clear?: boolean | undefined;
    pressEnter?: boolean | undefined;
    delay?: number | undefined;
}, {
    text: string;
    snapshot?: {
        include?: boolean | undefined;
        scope?: string | undefined;
        format?: "compact" | "full" | "diff" | "minimal" | undefined;
    } | undefined;
    timeout?: number | undefined;
    ref?: string | undefined;
    selector?: string | undefined;
    clear?: boolean | undefined;
    pressEnter?: boolean | undefined;
    delay?: number | undefined;
}>, {
    text: string;
    snapshot?: {
        include?: boolean | undefined;
        scope?: string | undefined;
        format?: "compact" | "full" | "diff" | "minimal" | undefined;
    } | undefined;
    timeout?: number | undefined;
    ref?: string | undefined;
    selector?: string | undefined;
    clear?: boolean | undefined;
    pressEnter?: boolean | undefined;
    delay?: number | undefined;
}, {
    text: string;
    snapshot?: {
        include?: boolean | undefined;
        scope?: string | undefined;
        format?: "compact" | "full" | "diff" | "minimal" | undefined;
    } | undefined;
    timeout?: number | undefined;
    ref?: string | undefined;
    selector?: string | undefined;
    clear?: boolean | undefined;
    pressEnter?: boolean | undefined;
    delay?: number | undefined;
}>;
export type TypeInput = z.infer<typeof typeSchema>;
export declare function executeType(input: TypeInput): Promise<ToolResponse>;
export declare const typeTool: {
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
            text: {
                type: string;
                description: string;
            };
            clear: {
                type: string;
                description: string;
            };
            pressEnter: {
                type: string;
                description: string;
            };
            delay: {
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
        required: string[];
    };
};
//# sourceMappingURL=type.d.ts.map