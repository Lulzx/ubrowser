import { z } from 'zod';
export declare const pagesSchema: z.ZodObject<{
    action: z.ZodEnum<["list", "create", "switch", "close"]>;
    name: z.ZodOptional<z.ZodString>;
    snapshot: z.ZodOptional<z.ZodObject<{
        include: z.ZodOptional<z.ZodBoolean>;
        format: z.ZodOptional<z.ZodEnum<["full", "diff", "minimal"]>>;
    }, "strip", z.ZodTypeAny, {
        include?: boolean | undefined;
        format?: "full" | "diff" | "minimal" | undefined;
    }, {
        include?: boolean | undefined;
        format?: "full" | "diff" | "minimal" | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    action: "switch" | "list" | "create" | "close";
    name?: string | undefined;
    snapshot?: {
        include?: boolean | undefined;
        format?: "full" | "diff" | "minimal" | undefined;
    } | undefined;
}, {
    action: "switch" | "list" | "create" | "close";
    name?: string | undefined;
    snapshot?: {
        include?: boolean | undefined;
        format?: "full" | "diff" | "minimal" | undefined;
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
                };
            };
        };
        required: string[];
    };
};
export {};
//# sourceMappingURL=pages.d.ts.map