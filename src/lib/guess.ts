import type { Item } from '../types';

type GarmentType = Item['garmentType'];

// Whole-word matches only ("brand" must not hit "bra", "street" must not hit "tee").
const w = (words: string) => new RegExp(`\\b(?:${words})\\b`);

const CATEGORY_RULES: { category: string; re: RegExp }[] = [
  { category: 'outerwear',   re: w('jackets?|coats?|blazers?|cardigans?|vests?|waistcoats?|parkas?|windbreakers?|shrugs?|bomber|bandhgala|overshirts?|shackets?|puffers?|gilets?|trench(?:es)?') },
  { category: 'pants',       re: w('jeans|trousers?|pants?|sweatpants?|leggings?|shorts|chinos?|joggers?|palazzos?|salwar|dhotis?') },
  { category: 'dresses',     re: w('dress(?:es)?|skirts?|gowns?|frocks?|sarees?|lehengas?') },
  { category: 'shoes',       re: w('shoes?|sneakers?|boots?|heels?|sandals?|loafers?|slippers?|footwear') },
  { category: 'tops',        re: w('shirts?|t-?shirts?|tees?|tops?|blouses?|polos?|sweatshirts?|hoodies?|sweaters?|pullovers?|kurtas?|kurtis?|tunics?') },
  { category: 'bags',        re: w('bags?|purses?|handbags?|backpacks?|totes?|clutch(?:es)?') },
  { category: 'innerwear',   re: w('underwear|bras?|boxers?|briefs?|lingerie|innerwear') },
  { category: 'accessories', re: w('watch(?:es)?|necklaces?|bracelets?|rings?|earrings?|accessor(?:y|ies)|sunglasses|caps?|hats?|belts?|scarf|scarves|dupattas?|stoles?') },
];

/** Position just after the last match of re in s, or -1. */
function lastMatchEnd(re: RegExp, s: string): number {
  const g = new RegExp(re.source, 'g');
  let end = -1;
  for (let m = g.exec(s); m; m = g.exec(s)) end = m.index + m[0].length;
  return end;
}

/**
 * Title first, then description, then URL: brand names in URLs ("buda-jeans-co-...-t-shirt") must not
 * outvote the title. Within one source the garment word nearest the end wins, since product titles
 * end with the noun ("Washed Jeans Jacket"); ties keep rule order.
 */
function pick<T>(rules: { re: RegExp; value: T }[], title: string, description: string, url: string): T | undefined {
  for (const src of [title, description, url]) {
    const s = src.toLowerCase();
    let best: T | undefined;
    let bestEnd = -1;
    for (const r of rules) {
      const end = lastMatchEnd(r.re, s);
      if (end > bestEnd) { bestEnd = end; best = r.value; }
    }
    if (best !== undefined) return best;
  }
  return undefined;
}

export function guessCategory(title: string, description: string, url: string): string {
  return pick(CATEGORY_RULES.map(r => ({ re: r.re, value: r.category })), title, description, url) ?? '';
}

const GARMENT_RULES: { type: GarmentType; re: RegExp }[] = [
  { type: 'layer',     re: w('jackets?|coats?|blazers?|cardigans?|vests?|waistcoats?|parkas?|windbreakers?|shrugs?|bomber|bandhgala|sherwanis?|overshirts?|shackets?|puffers?|gilets?|trench(?:es)?') },
  { type: 'bottom',    re: w('jeans|trousers?|pants?|sweatpants?|leggings?|shorts|chinos?|skirts?|joggers?|palazzos?|salwar|dhotis?') },
  { type: 'top',       re: w('shirts?|t-?shirts?|tees?|tops?|blouses?|polos?|sweatshirts?|hoodies?|sweaters?|pullovers?|kurtas?|kurtis?|tunics?') },
  { type: 'accessory', re: w('watch(?:es)?|necklaces?|bracelets?|rings?|earrings?|sunglasses|caps?|hats?|belts?|scarf|scarves|dupattas?|stoles?|bags?|purses?|handbags?|backpacks?|totes?|clutch(?:es)?|shoes?|sneakers?|boots?|heels?|sandals?|loafers?|slippers?|footwear') },
];

/** Closet role for the outfit builder, guessed from product text. 'other' when unsure. */
export function guessGarmentType(title: string, description: string, url: string): GarmentType {
  return pick(GARMENT_RULES.map(r => ({ re: r.re, value: r.type })), title, description, url) ?? 'other';
}
