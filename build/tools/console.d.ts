import { z } from 'zod';
import { type ConsoleMessage } from '../browser/manager.js';
export declare const consoleSchema: z.ZodObject<{
    action: z.ZodEnum<["get", "clear"]>;
    filter: z.ZodOptional<z.ZodEnum<["all", "log", "error", "warn", "info", "debug"]>>;
    limit: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    action: "clear" | "get";
    filter?: "all" | "log" | "debug" | "info" | "error" | "warn" | undefined;
    limit?: number | undefined;
}, {
    action: "clear" | "get";
    filter?: "all" | "log" | "debug" | "info" | "error" | "warn" | undefined;
    limit?: number | undefined;
}>;
export type ConsoleInput = z.infer<typeof consoleSchema>;
interface ConsoleResult {
    ok: boolean;
    action: string;
    messages?: ConsoleMessage[];
    count?: number;
    error?: string;
}
export declare function executeConsole(input: ConsoleInput): Promise<ConsoleResult>;
export declare const consoleTool: {
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
            filter: {
                type: string;
                enum: string[];
                description: string;
            };
            limit: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
export {};
//# sourceMappingURL=console.d.ts.map