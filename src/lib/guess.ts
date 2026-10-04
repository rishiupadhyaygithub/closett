import type { Item } from '../types';

type GarmentType = Item['garmentType'];

// Whole-word matches only ("brand" must not hit "bra", "street" must not hit "tee").
const w = (words: string) => new RegExp(`\\b(?:${words})\\b`);

const CATEGORY_RULES: { category: string; re: RegExp }[] = [
  { category: 'outerwear',   re: w('jackets?|coats?|blazers?|cardigans?|vests?|waistcoats?|parkas?|windbreakers?|shrugs?|bomber|bandhgala') },
  { category: 'pants',       re: w('jeans|trousers?|pants?|sweatpants?|leggings?|shorts|chinos?|joggers?|palazzos?|salwar|dhotis?') },
  { category: 'dresses',     re: w('dress(?:es)?|skirts?|gowns?|frocks?|sarees?|lehengas?') },
  { category: 'shoes',       re: w('shoes?|sneakers?|boots?|heels?|sandals?|loafers?|slippers?|footwear') },
  { category: 'tops',        re: w('shirts?|t-?shirts?|tees?|tops?|blouses?|polos?|sweatshirts?|hoodies?|sweaters?|pullovers?|kurtas?|kurtis?|tunics?') },
  { category: 'bags',        re: w('bags?|purses?|handbags?|backpacks?|totes?|clutch(?:es)?') },
  { category: 'innerwear',   re: w('underwear|bras?|boxers?|briefs?|lingerie|innerwear') },
  { category: 'accessories', re: w('watch(?:es)?|necklaces?|bracelets?|rings?|earrings?|accessor(?:y|ies)|sunglasses|caps?|hats?|belts?|scarf|scarves|dupattas?|stoles?') },
];

const text = (title: string, description: string, url: string) => `${title} ${description} ${url}`.toLowerCase();

export function guessCategory(title: string, description: string, url: string): string {
  const t = text(title, description, url);
  return CATEGORY_RULES.find(r => r.re.test(t))?.category ?? '';
}

const GARMENT_RULES: { type: GarmentType; re: RegExp }[] = [
  { type: 'layer',     re: w('jackets?|coats?|blazers?|cardigans?|vests?|waistcoats?|parkas?|windbreakers?|shrugs?|bomber|bandhgala|sherwanis?') },
  { type: 'bottom',    re: w('jeans|trousers?|pants?|sweatpants?|leggings?|shorts|chinos?|skirts?|joggers?|palazzos?|salwar|dhotis?') },
  { type: 'top',       re: w('shirts?|t-?shirts?|tees?|tops?|blouses?|polos?|sweatshirts?|hoodies?|sweaters?|pullovers?|kurtas?|kurtis?|tunics?') },
  { type: 'accessory', re: w('watch(?:es)?|necklaces?|bracelets?|rings?|earrings?|sunglasses|caps?|hats?|belts?|scarf|scarves|dupattas?|stoles?|bags?|purses?|handbags?|backpacks?|totes?|clutch(?:es)?|shoes?|sneakers?|boots?|heels?|sandals?|loafers?|slippers?|footwear') },
];

/** Closet role for the outfit builder, guessed from product text. 'other' when unsure. */
export function guessGarmentType(title: string, description: string, url: string): GarmentType {
  const t = text(title, description, url);
  return GARMENT_RULES.find(r => r.re.test(t))?.type ?? 'other';
}
