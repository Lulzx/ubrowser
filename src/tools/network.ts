import { z } from 'zod';
import { browserManager, type NetworkRequest } from '../browser/manager.js';
import { cleanError } from '../types.js';

// Schema for network tool
export const networkSchema = z.object({
  action: z.enum(['get', 'clear']).describe('Action to perform'),
  filter: z.string().optional().describe('URL pattern filter (supports * wildcard)'),
  limit: z.number().optional().describe('Limit number of requests returned'),
});

export type NetworkInput = z.infer<typeof networkSchema>;

interface NetworkResult {
  ok: boolean;
  action: string;
  requests?: NetworkRequest[];
  count?: number;
  error?: string;
}

// Execute network action
export async function executeNetwork(input: NetworkInput): Promise<NetworkResult> {
  try {
    switch (input.action) {
      case 'get': {
        const requests = browserManager.getNetworkRequests(input.filter, input.limit);
        return {
          ok: true,
          action: 'get',
          requests,
          count: requests.length,
        };
      }

      case 'clear': {
        browserManager.clearNetworkRequests();
        return {
          ok: true,
          action: 'clear',
        };
      }

      default:
        return { ok: false, action: input.action, error: 'Unknown action' };
    }
  } catch (error) {
    return {
      ok: false,
      action: input.action,
      error: cleanError(error),
    };
  }
}

// Tool definition for MCP
export const networkTool = {
  name: 'browser_network',
  description: `Inspect network requests made by the browser.

Actions:
- get: Get captured network requests (optionally filtered by URL pattern)
- clear: Clear the request buffer

Example: Get API requests
{"action": "get", "filter": "*/api/*"}`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      action: { type: 'string', enum: ['get', 'clear'], description: 'Action to perform' },
      filter: { type: 'string', description: 'URL pattern filter (supports * wildcard)' },
      limit: { type: 'number', description: 'Limit number of requests returned' },
    },
    required: ['action'],
  },
};
