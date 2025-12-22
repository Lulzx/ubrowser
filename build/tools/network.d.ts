import { z } from 'zod';
import { type NetworkRequest } from '../browser/manager.js';
export declare const networkSchema: z.ZodObject<{
    action: z.ZodEnum<["get", "clear"]>;
    filter: z.ZodOptional<z.ZodString>;
    limit: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    action: "clear" | "get";
    filter?: string | undefined;
    limit?: number | undefined;
}, {
    action: "clear" | "get";
    filter?: string | undefined;
    limit?: number | undefined;
}>;
export type NetworkInput = z.infer<typeof networkSchema>;
interface NetworkResult {
    ok: boolean;
    action: string;
    requests?: NetworkRequest[];
    count?: number;
    error?: string;
}
export declare function executeNetwork(input: NetworkInput): Promise<NetworkResult>;
export declare const networkTool: {
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
//# sourceMappingURL=network.d.ts.map