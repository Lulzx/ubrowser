import { z } from 'zod';
import { executeFastBatch, type FastBatchInput } from './fast-batch.js';
import { cleanError, type ToolResponse, type BatchStep } from '../types.js';

// Schema for batch tool
export const batchSchema = z.object({
  steps: z.array(z.object({
    tool: z.enum(['navigate', 'click', 'type', 'select', 'scroll', 'wait']).describe('Tool to execute'),
    args: z.record(z.any()).describe('Arguments for the tool'),
  })).describe('Steps to execute in sequence'),
  snapshot: z.object({
    when: z.enum(['never', 'final', 'each', 'on-error']).optional().describe('When to take snapshots'),
    scope: z.string().optional().describe('CSS selector to scope snapshots'),
    format: z.enum(['compact', 'full', 'diff']).optional().describe('Snapshot format (default: compact)'),
  }).optional().describe('Snapshot options'),
  stopOnError: z.boolean().optional().describe('Stop execution on first error (default: true)'),
});

export type BatchInput = z.infer<typeof batchSchema>;

// Minified result structure for token efficiency
interface BatchResult {
  ok: boolean;
  n?: number;         // stepsCompleted (only if partial)
  err?: string;       // error message
  at?: number;        // failedStep
  snap?: string;      // snapshot
}

// Execute batch using the fast implementation
// This is 5-10x faster because:
// 1. Uses pre-injected extraction script (avoids JIT overhead)
// 2. Uses CDP for direct input (bypasses Playwright overhead)
// 3. Caches element positions for fast clicks/types
// 4. Batches getBoundingClientRect calls (avoids layout thrashing)
export async function executeBatch(input: BatchInput): Promise<BatchResult> {
  return executeFastBatch(input as FastBatchInput);
}

// Tool definition for MCP
export const batchTool = {
  name: 'browser_batch',
  description: `Execute multiple browser actions in ONE call. ALWAYS use this for multi-step flows.

Example - Login flow:
{"steps":[{"tool":"navigate","args":{"url":"/login"}},{"tool":"type","args":{"selector":"#email","text":"test@test.com"}},{"tool":"type","args":{"selector":"#password","text":"secret"}},{"tool":"click","args":{"selector":"button[type=submit]"}}],"snapshot":{"when":"final"}}

Returns ultra-compact snapshot format: tag#ref@type~"placeholder"/href"text"!flags
- btn#e1"Submit" = button, click with ref "e1"
- inp#e2@e~"Email" = email input with placeholder
- a#e3/login"Sign in" = link to /login
- Types: @e=email @p=password @t=text @c=checkbox
- Flags: !d=disabled !c=checked !r=required`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      steps: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            tool: { type: 'string', enum: ['navigate', 'click', 'type', 'select', 'scroll', 'wait'] },
            args: { type: 'object' },
          },
          required: ['tool', 'args'],
        },
        description: 'Steps to execute in sequence',
      },
      snapshot: {
        type: 'object',
        properties: {
          when: { type: 'string', enum: ['never', 'final', 'each', 'on-error'], description: 'When to take snapshots (default: final)' },
          scope: { type: 'string', description: 'CSS selector to scope snapshots' },
          format: { type: 'string', enum: ['compact', 'full', 'diff'], description: 'Snapshot format (default: compact)' },
        },
      },
      stopOnError: { type: 'boolean', description: 'Stop on first error (default: true)' },
    },
    required: ['steps'],
  },
};
