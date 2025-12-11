import { z } from 'zod';
import type { ToolResponse } from '../types.js';
export declare const selectSchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    ref: z.ZodOptional<z.ZodString>;
    selector: z.ZodOptional<z.ZodString>;
    value: z.ZodOptional<z.ZodString>;
    label: z.ZodOptional<z.ZodString>;
    index: z.ZodOptional<z.ZodNumber>;
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
    label?: string | undefined;
    value?: string | undefined;
    snapshot?: {
        include?: boolean | undefined;
        scope?: string | undefined;
        format?: "compact" | "full" | "diff" | "minimal" | undefined;
    } | undefined;
    timeout?: number | undefined;
    ref?: string | undefined;
    selector?: string | undefined;
    index?: number | undefined;
}, {
    label?: string | undefined;
    value?: string | undefined;
    snapshot?: {
        include?: boolean | undefined;
        scope?: string | undefined;
        format?: "compact" | "full" | "diff" | "minimal" | undefined;
    } | undefined;
    timeout?: number | undefined;
    ref?: string | undefined;
    selector?: string | undefined;
    index?: number | undefined;
}>, {
    label?: string | undefined;
    value?: string | undefined;
    snapshot?: {
        include?: boolean | undefined;
        scope?: string | undefined;
        format?: "compact" | "full" | "diff" | "minimal" | undefined;
    } | undefined;
    timeout?: number | undefined;
    ref?: string | undefined;
    selector?: string | undefined;
    index?: number | undefined;
}, {
    label?: string | undefined;
    value?: string | undefined;
    snapshot?: {
        include?: boolean | undefined;
        scope?: string | undefined;
        format?: "compact" | "full" | "diff" | "minimal" | undefined;
    } | undefined;
    timeout?: number | undefined;
    ref?: string | undefined;
    selector?: string | undefined;
    index?: number | undefined;
}>, {
    label?: string | undefined;
    value?: string | undefined;
    snapshot?: {
        include?: boolean | undefined;
        scope?: string | undefined;
        format?: "compact" | "full" | "diff" | "minimal" | undefined;
    } | undefined;
    timeout?: number | undefined;
    ref?: string | undefined;
    selector?: string | undefined;
    index?: number | undefined;
}, {
    label?: string | undefined;
    value?: string | undefined;
    snapshot?: {
        include?: boolean | undefined;
        scope?: string | undefined;
        format?: "compact" | "full" | "diff" | "minimal" | undefined;
    } | undefined;
    timeout?: number | undefined;
    ref?: string | undefined;
    selector?: string | undefined;
    index?: number | undefined;
}>;
export type SelectInput = z.infer<typeof selectSchema>;
export declare function executeSelect(input: SelectInput): Promise<ToolResponse>;
export declare const selectTool: {
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
            value: {
                type: string;
                description: string;
            };
            label: {
                type: string;
                description: string;
            };
            index: {
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
//# sourceMappingURL=select.d.ts.map