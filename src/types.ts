import type { Browser, BrowserContext, Page } from 'playwright';

// Element reference - minimal representation for token efficiency
export interface ElementRef {
  id: string;           // Short ID like "e1", "e2"
  selector: string;     // CSS selector for re-query
  role: string;         // Accessibility role
  name: string;         // Accessible name
  tag: string;          // HTML tag
  attributes?: Record<string, string>; // Key attributes (type, href, etc.)
}

// Pruned snapshot - optimized for token efficiency
export interface PrunedSnapshot {
  url: string;
  title: string;
  elements: ElementRef[];
  hash: string;         // For diff detection
  timestamp: number;
}

// Diff between snapshots
export interface SnapshotDiff {
  added: ElementRef[];
  removed: string[];     // Just IDs
  modified: Array<{id: string; changes: string}>;
  unchanged: number;     // Count only
}

// Tool response - minimal by default
export interface ToolResponse {
  ok: boolean;
  snapshot?: string;    // Only when requested
  error?: string;
  url?: string;
  title?: string;
}

// Snapshot options for tools
export interface SnapshotOptions {
  include?: boolean;      // Default: false
  scope?: string;         // CSS selector to scope
  format?: 'compact' | 'full' | 'diff' | 'minimal';
}

// Common tool options
export interface ToolOptions {
  snapshot?: SnapshotOptions;
  timeout?: number;        // Default: 30000
}

// Batch step definition
export interface BatchStep {
  tool: 'navigate' | 'click' | 'type' | 'select' | 'scroll' | 'wait';
  args: Record<string, unknown>;
}

// Batch snapshot options
export interface BatchSnapshotOptions {
  when: 'never' | 'final' | 'each' | 'on-error';
  scope?: string;
  format?: 'compact' | 'full' | 'diff';
}

// Browser state
export interface BrowserState {
  browser: Browser | null;
  context: BrowserContext | null;
  page: Page | null;
  initialized: boolean;
}

// Interactive element roles to keep during pruning
export const INTERACTIVE_ROLES = new Set([
  'button',
  'link',
  'textbox',
  'combobox',
  'listbox',
  'option',
  'checkbox',
  'radio',
  'switch',
  'slider',
  'spinbutton',
  'searchbox',
  'tab',
  'tabpanel',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'menu',
  'menubar',
  'treeitem',
  'gridcell',
  'row',
  'cell',
]);

// Non-interactive roles to filter out
export const NON_INTERACTIVE_ROLES = new Set([
  'presentation',
  'none',
  'generic',
  'group',
  'region',
  'article',
  'banner',
  'complementary',
  'contentinfo',
  'figure',
  'img',
  'list',
  'listitem',
  'main',
  'navigation',
  'separator',
  'toolbar',
]);

// HTML tags that are typically interactive
export const INTERACTIVE_TAGS = new Set([
  'a',
  'button',
  'input',
  'select',
  'textarea',
  'details',
  'summary',
]);
