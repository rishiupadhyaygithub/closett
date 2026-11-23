import type { ColorRule, Item, UserProfile } from '../types';
import { assessItem } from './suitability';
import { isColorRecommended } from '../colorData';

export type ShelfId = 'tops' | 'bottoms' | 'layers' | 'shoes' | 'accessories';

/** Wardrobe order, top shelf first: what you pick first, then what goes with it. */
export const SHELVES: { id: ShelfId; label: string; hint: string }[] = [
  { id: 'tops', label: 'Tops', hint: 'Hover or tap a top to match the rest' },
  { id: 'bottoms', label: 'Bottoms', hint: 'Best match for the top first' },
  { id: 'layers', label: 'Layers', hint: 'Optional: jackets and overshirts' },
  { id: 'shoes', label: 'Shoes', hint: '' },
  { id: 'accessories', label: 'Accessories', hint: 'Watches, bracelets and the rest' },
];

const SHOE = /\b(?:shoes?|sneakers?|loafers?|boots?|sandals?|sliders?|slides|heels?|trainers?|footwear|mojaris?|juttis?|kolhapuris?|flip[- ]?flops?|derbys?|derbies|oxfords?|brogues?|moccasins?|espadrilles?|slippers?)\b/i;

export function shelfOf(item: Item, categoryName: string): ShelfId {
  switch (item.garmentType) {
    case 'top': return 'tops';
    case 'bottom': return 'bottoms';
    case 'layer': return 'layers';
    default: return SHOE.test(item.title) || SHOE.test(categoryName) ? 'shoes' : 'accessories';
  }
}

export function groupShelves(items: Item[], categoryName: (id: string) => string): Record<ShelfId, Item[]> {
  const out: Record<ShelfId, Item[]> = { tops: [], bottoms: [], layers: [], shoes: [], accessories: [] };
  for (const it of items) out[shelfOf(it, categoryName(it.categoryId))].push(it);
  return out;
}

export interface Ranked { item: Item; match: boolean; avoid: boolean }

/**
 * Orders pieces by how well they go with the chosen top: colours your rules pair with it first,
 * colours that suit your undertone next, pieces that do not suit you last. Ties keep their order.
 */
export function rankForTop(top: Item | null, items: Item[], rules: ColorRule[], profile: UserProfile | null): Ranked[] {
  const pairs = (top && rules.find(r => r.topColor === top.color)?.bottomColors) || [];
  const scored = items.map((item, index) => {
    const avoid = assessItem(item, profile).avoid;
    const match = !!top && !!item.color && pairs.includes(item.color);
    let score = 0;
    if (match) score += 2;
    if (isColorRecommended(item.color, profile?.undertone ?? null) === true) score += 1;
    if (avoid) score -= 3;
    return { item, match: match && !avoid, avoid, score, index };
  });
  if (top) scored.sort((a, b) => b.score - a.score || a.index - b.index);
  return scored.map(({ item, match, avoid }) => ({ item, match, avoid }));
}
