import { z } from 'zod';
import { browserManager, type ConsoleMessage } from '../browser/manager.js';
import { cleanError } from '../types.js';

// Schema for console tool
export const consoleSchema = z.object({
  action: z.enum(['get', 'clear']).describe('Action to perform'),
  filter: z.enum(['all', 'log', 'error', 'warn', 'info', 'debug']).optional().describe('Filter by message type'),
  limit: z.number().optional().describe('Limit number of messages returned'),
});

export type ConsoleInput = z.infer<typeof consoleSchema>;

interface ConsoleResult {
  ok: boolean;
  action: string;
  messages?: ConsoleMessage[];
  count?: number;
  error?: string;
}

// Execute console action
export async function executeConsole(input: ConsoleInput): Promise<ConsoleResult> {
  try {
    switch (input.action) {
      case 'get': {
        const messages = browserManager.getConsoleMessages(input.filter, input.limit);
        return {
          ok: true,
          action: 'get',
          messages,
          count: messages.length,
        };
      }

      case 'clear': {
        browserManager.clearConsoleMessages();
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
export const consoleTool = {
  name: 'browser_console',
  description: `Access browser console messages (logs, errors, warnings).

Actions:
- get: Get captured console messages (optionally filtered by type)
- clear: Clear the message buffer

Example: Get all error messages
{"action": "get", "filter": "error"}`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      action: { type: 'string', enum: ['get', 'clear'], description: 'Action to perform' },
      filter: { type: 'string', enum: ['all', 'log', 'error', 'warn', 'info', 'debug'], description: 'Filter by message type' },
      limit: { type: 'number', description: 'Limit number of messages returned' },
    },
    required: ['action'],
  },
};
