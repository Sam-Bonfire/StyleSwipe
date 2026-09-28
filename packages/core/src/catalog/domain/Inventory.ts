/**
 * Inventory / stock-status rules (catalog context).
 * Pure helpers over the `inventoryInfo` attribute shape so screens
 * never reimplement stock logic inline.
 */

export interface InventoryEntry {
  available: boolean;
  inventory: number;
  label: string;
}

export interface StockStatus {
  /** Labels with sellable units, e.g. `['S', 'M']`. */
  labels: string[];
  /** Display string, e.g. `'In Stock (S, M)'` or `'Out of Stock'`. */
  label: string;
}

/** Labels of entries that are available and have units on hand. */
export function inStockLabels(entries: unknown): string[] {
  if (!Array.isArray(entries)) return [];
  return (entries as Partial<InventoryEntry>[])
    .filter((e) => e?.available === true && (e?.inventory ?? 0) > 0)
    .map((e) => String(e?.label ?? ''));
}

/** Full stock status (labels + display string) for an `inventoryInfo` value. */
export function describeStock(entries: unknown): StockStatus {
  const labels = inStockLabels(entries);
  return {
    labels,
    label: labels.length > 0 ? `In Stock (${labels.join(', ')})` : 'Out of Stock',
  };
}
