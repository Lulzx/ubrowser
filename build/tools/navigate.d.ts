import { z } from 'zod';
import { type ToolResponse } from '../types.js';
export declare const navigateSchema: z.ZodObject<{
    url: z.ZodString;
    waitUntil: z.ZodOptional<z.ZodEnum<["load", "domcontentloaded", "networkidle"]>>;
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
    url: string;
    waitUntil?: "load" | "domcontentloaded" | "networkidle" | undefined;
    snapshot?: {
        include?: boolean | undefined;
        scope?: string | undefined;
        format?: "compact" | "full" | "diff" | "minimal" | undefined;
    } | undefined;
    timeout?: number | undefined;
}, {
    url: string;
    waitUntil?: "load" | "domcontentloaded" | "networkidle" | undefined;
    snapshot?: {
        include?: boolean | undefined;
        scope?: string | undefined;
        format?: "compact" | "full" | "diff" | "minimal" | undefined;
    } | undefined;
    timeout?: number | undefined;
}>;
export type NavigateInput = z.infer<typeof navigateSchema>;
export declare function executeNavigate(input: NavigateInput): Promise<ToolResponse>;
export declare const navigateTool: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            url: {
                type: string;
                description: string;
            };
            waitUntil: {
                type: string;
                enum: string[];
                description: string;
            };
            snapshot: {
                type: string;
                properties: {
                    include: {
                        type: string;
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
                description: string;
            };
            timeout: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
//# sourceMappingURL=navigate.d.ts.map