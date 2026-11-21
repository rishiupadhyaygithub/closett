import type { Item, Category, SortOption } from '../types';

export interface ItemQuery {
  /** Category ids to include (the selected collection plus its descendants); null means all. */
  categoryIds: string[] | null;
  query: string;
  sortBy: SortOption;
}

/** Items that match the collection and search box, in the chosen order. Does not mutate `items`. */
export function filterAndSortItems(items: Item[], { categoryIds, query, sortBy }: ItemQuery): Item[] {
  const q = query.trim().toLowerCase();
  const allowed = categoryIds ? new Set(categoryIds) : null;
  const result = items.filter(item =>
    (!allowed || allowed.has(item.categoryId)) &&
    (!q || item.title.toLowerCase().includes(q) || item.notes.toLowerCase().includes(q)),
  );

  // Unpriced items (price 0) always sort last, in either direction.
  const priced = (a: Item, b: Item, dir: 1 | -1) =>
    (a.price > 0 ? 0 : 1) - (b.price > 0 ? 0 : 1) || dir * (a.price - b.price);

  switch (sortBy) {
    case 'newest':    return result.sort((a, b) => b.createdAt - a.createdAt);
    case 'oldest':    return result.sort((a, b) => a.createdAt - b.createdAt);
    case 'priceAsc':  return result.sort((a, b) => priced(a, b, 1));
    case 'priceDesc': return result.sort((a, b) => priced(a, b, -1));
    case 'nameAsc':   return result.sort((a, b) => a.title.localeCompare(b.title));
    case 'nameDesc':  return result.sort((a, b) => b.title.localeCompare(a.title));
  }
}

function childrenByParent(categories: Category[]): Map<string | null, Category[]> {
  const ids = new Set(categories.map(c => c.id));
  const map = new Map<string | null, Category[]>();
  for (const c of categories) {
    const key = c.parentId && ids.has(c.parentId) ? c.parentId : null; // orphans act as roots
    (map.get(key) ?? map.set(key, []).get(key)!).push(c);
  }
  for (const list of map.values()) list.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  return map;
}

/** Item count per category id, each parent including everything below it. One pass, not one walk per category. */
export function categoryCounts(categories: Category[], items: Item[]): Map<string, number> {
  const children = childrenByParent(categories);
  const direct = new Map<string, number>();
  for (const item of items) direct.set(item.categoryId, (direct.get(item.categoryId) ?? 0) + 1);

  const totals = new Map<string, number>();
  const visiting = new Set<string>();
  const total = (id: string): number => {
    if (totals.has(id)) return totals.get(id)!;
    if (visiting.has(id)) return 0; // cycle guard
    visiting.add(id);
    let sum = direct.get(id) ?? 0;
    for (const child of children.get(id) ?? []) sum += total(child.id);
    visiting.delete(id);
    totals.set(id, sum);
    return sum;
  };
  for (const c of categories) total(c.id);
  return totals;
}

/** Categories in tree order (parent, then its children) with a depth for indenting a dropdown. */
export function flattenCategories(categories: Category[]): { id: string; name: string; depth: number }[] {
  const children = childrenByParent(categories);
  const out: { id: string; name: string; depth: number }[] = [];
  const seen = new Set<string>();
  const walk = (list: Category[], depth: number) => {
    for (const c of list) {
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      out.push({ id: c.id, name: c.name, depth });
      walk(children.get(c.id) ?? [], depth + 1);
    }
  };
  walk(children.get(null) ?? [], 0);
  for (const c of categories) if (!seen.has(c.id)) { seen.add(c.id); out.push({ id: c.id, name: c.name, depth: 0 }); } // cycles
  return out;
}

/** Ids of every collection nested under `id` (any depth). Safe on accidental parent cycles. */
export function descendantIds(categories: Category[], id: string): string[] {
  const found = new Set<string>();
  const queue = [id];
  while (queue.length) {
    const parent = queue.shift()!;
    for (const c of categories) {
      if (c.parentId === parent && !found.has(c.id)) { found.add(c.id); queue.push(c.id); }
    }
  }
  return [...found];
}
