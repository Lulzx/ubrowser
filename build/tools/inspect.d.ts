import { z } from 'zod';
export declare const inspectSchema: z.ZodObject<{
    selector: z.ZodString;
    depth: z.ZodOptional<z.ZodNumber>;
    includeText: z.ZodOptional<z.ZodBoolean>;
    format: z.ZodOptional<z.ZodEnum<["compact", "full", "minimal"]>>;
}, "strip", z.ZodTypeAny, {
    selector: string;
    format?: "compact" | "full" | "minimal" | undefined;
    depth?: number | undefined;
    includeText?: boolean | undefined;
}, {
    selector: string;
    format?: "compact" | "full" | "minimal" | undefined;
    depth?: number | undefined;
    includeText?: boolean | undefined;
}>;
export type InspectInput = z.infer<typeof inspectSchema>;
interface InspectResult {
    ok: boolean;
    exists: boolean;
    visible?: boolean;
    tagName?: string;
    text?: string;
    attributes?: Record<string, string>;
    childCount?: number;
    snapshot?: string;
    error?: string;
}
export declare function executeInspect(input: InspectInput): Promise<InspectResult>;
export declare const inspectTool: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            selector: {
                type: string;
                description: string;
            };
            depth: {
                type: string;
                description: string;
            };
            includeText: {
                type: string;
                description: string;
            };
            format: {
                type: string;
                enum: string[];
                description: string;
            };
        };
        required: string[];
    };
};
export {};
//# sourceMappingURL=inspect.d.ts.map