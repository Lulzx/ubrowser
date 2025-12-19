import type { ElementRef } from '../types.js';
import { refManager } from '../refs/manager.js';

// Filter elements array (from extractInteractiveElements)
// This is the main function used by all tools
export function filterElements(
  elements: Array<{
    selector: string;
    role: string;
    name: string;
    tag: string;
    attributes: Record<string, string | number>;
  }>,
  options: { maxElements?: number } = {}
): ElementRef[] {
  const maxElements = options.maxElements ?? 100;
  const refs: ElementRef[] = [];

  for (const el of elements.slice(0, maxElements)) {
    const filteredAttributes: Record<string, string> = {};
    for (const [key, value] of Object.entries(el.attributes)) {
      if (key.startsWith('_')) continue;
      if (value === undefined || value === null) continue;
      filteredAttributes[key] = String(value);
    }

    const id = refManager.getOrCreate(
      el.selector,
      el.role,
      el.name,
      el.tag,
      filteredAttributes
    );

    refs.push({
      id,
      selector: el.selector,
      role: el.role,
      name: el.name,
      tag: el.tag,
      attributes: filteredAttributes,
    });
  }

  return refs;
}

// Collapse repetitive elements (e.g., long lists)
export function collapseRepetitive(
  elements: ElementRef[],
  threshold: number = 5
): ElementRef[] {
  // Group elements by tag+role pattern
  const groups = new Map<string, ElementRef[]>();

  for (const el of elements) {
    const key = `${el.tag}:${el.role}`;
    const group = groups.get(key) || [];
    group.push(el);
    groups.set(key, group);
  }

  const result: ElementRef[] = [];
  const collapsed = new Set<string>();

  for (const el of elements) {
    const key = `${el.tag}:${el.role}`;
    const group = groups.get(key)!;

    if (group.length > threshold && !collapsed.has(key)) {
      // Keep first 3, collapse the rest
      const kept = group.slice(0, 3);
      result.push(...kept);

      // Add a summary element
      result.push({
        id: `${key}-summary`,
        selector: '',
        role: 'note',
        name: `... and ${group.length - 3} more ${el.tag} elements`,
        tag: 'span',
      });

      collapsed.add(key);
    } else if (!collapsed.has(key) || group.length <= threshold) {
      // Keep if not part of a collapsed group
      if (group.length <= threshold) {
        result.push(el);
      }
    }
  }

  return result;
}
