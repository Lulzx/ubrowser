import { z } from 'zod';
export declare const pagesSchema: z.ZodObject<{
    action: z.ZodEnum<["list", "create", "switch", "close"]>;
    name: z.ZodOptional<z.ZodString>;
    snapshot: z.ZodOptional<z.ZodObject<{
        include: z.ZodOptional<z.ZodBoolean>;
        format: z.ZodOptional<z.ZodEnum<["compact", "full", "diff", "minimal"]>>;
        maxElements: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        maxElements?: number | undefined;
        format?: "compact" | "full" | "diff" | "minimal" | undefined;
        include?: boolean | undefined;
    }, {
        maxElements?: number | undefined;
        format?: "compact" | "full" | "diff" | "minimal" | undefined;
        include?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    action: "switch" | "list" | "close" | "create";
    name?: string | undefined;
    snapshot?: {
        maxElements?: number | undefined;
        format?: "compact" | "full" | "diff" | "minimal" | undefined;
        include?: boolean | undefined;
    } | undefined;
}, {
    action: "switch" | "list" | "close" | "create";
    name?: string | undefined;
    snapshot?: {
        maxElements?: number | undefined;
        format?: "compact" | "full" | "diff" | "minimal" | undefined;
        include?: boolean | undefined;
    } | undefined;
}>;
export type PagesInput = z.infer<typeof pagesSchema>;
interface PagesResult {
    ok: boolean;
    action: string;
    pages?: string[];
    currentPage?: string;
    created?: string;
    switched?: string;
    closed?: string;
    snapshot?: string;
    error?: string;
}
export declare function executePages(input: PagesInput): Promise<PagesResult>;
export declare const pagesTool: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            action: {
                type: string;
                enum: string[];
                description: string;
            };
            name: {
                type: string;
                description: string;
            };
            snapshot: {
                type: string;
                properties: {
                    include: {
                        type: string;
                    };
                    format: {
                        type: string;
                        enum: string[];
                    };
                    maxElements: {
                        type: string;
                    };
                };
            };
        };
        required: string[];
    };
};
export {};
//# sourceMappingURL=pages.d.ts.map