import type { Item, UserProfile } from '../types';
import { getBodyTypeAdvice } from '../bodyTypeData';
import { getColorName, isColorRecommended } from '../colorData';

export interface Assessment {
  /** True when anything about the piece goes against the profile: the card turns red. */
  avoid: boolean;
  issues: { kind: 'fit' | 'color'; text: string }[];
  goods: string[];
}

type Garment = Item['garmentType'];

/**
 * Words in body-type advice that can be checked against a product title.
 * `advice` finds the word in the advice line; `title` finds it in the product name.
 */
const FIT_TERMS: { advice: RegExp; title: RegExp }[] = [
  { advice: /skinny/i, title: /\bskinny\b/i },
  { advice: /oversized/i, title: /\bover-?sized?\b/i },
  { advice: /baggy/i, title: /\bbaggy\b/i },
  { advice: /boxy/i, title: /\bboxy\b/i },
  { advice: /tapered/i, title: /\btapered\b/i },
  { advice: /pleated/i, title: /\bpleat(?:ed|s)?\b/i },
  { advice: /wide-leg/i, title: /\bwide\b/i },
  { advice: /crop/i, title: /\bcrop(?:ped)?\b/i },
  { advice: /tight/i, title: /\b(?:tight|bodycon|compression)\b/i },
  { advice: /high-waisted/i, title: /\bhigh[- ]?(?:waist(?:ed)?|rise)\b/i },
  { advice: /double-breasted/i, title: /\bdouble[- ]breasted\b/i },
  // Only horizontal stripes are ever advised against; a plain "striped" title does not say which way.
  { advice: /horizontal stripe/i, title: /\b(?:horizontal(?:ly)?[\s-]*strip|breton)/i },
  { advice: /off-shoulder/i, title: /\boff[- ]shoulder\b/i },
  { advice: /epaulette/i, title: /\bepaulet/i },
  { advice: /boat neck/i, title: /\bboat[- ]?neck/i },
  { advice: /puff/i, title: /\bpuff(?:ed)?\b/i },
];

/** Which garments an advice line is about. Empty when it is about none we can judge (dresses). */
function scopeOf(advice: string): Garment[] {
  const tops = /\b(?:tops?|shirts?|sleeves?|necklines?|chest)\b/i.test(advice);
  const bottoms = /\b(?:jeans|trousers|pants|bottoms|cuts|hips?)\b/i.test(advice);
  const jackets = /\bjackets?\b/i.test(advice);
  if (/\bdress(?:es)?\b/i.test(advice) && !tops && !bottoms) return [];
  const out: Garment[] = [];
  if (tops) out.push('top', 'layer');
  if (bottoms) out.push('bottom');
  if (jackets) out.push('layer');
  return out.length ? out : ['top', 'bottom', 'layer'];
}

function fitIssues(item: Item, profile: UserProfile): string[] {
  const advice = getBodyTypeAdvice(profile.bodyType, profile.gender);
  if (!advice || item.garmentType === 'accessory' || item.garmentType === 'other') return [];
  const found: string[] = [];
  for (const line of advice.avoidFits) {
    // "X with Y" is about pairing two pieces; one piece alone cannot break it.
    if (/\bwith\b/i.test(line)) continue;
    if (!scopeOf(line).includes(item.garmentType)) continue;
    if (FIT_TERMS.some(t => t.advice.test(line) && t.title.test(item.title))) {
      found.push(`${advice.label} build: avoid ${line.charAt(0).toLowerCase()}${line.slice(1)}`);
    }
  }
  return found;
}

/** Does this piece suit the person in the profile, and why. */
export function assessItem(item: Item, profile: UserProfile | null): Assessment {
  if (!profile) return { avoid: false, issues: [], goods: [] };
  const issues: Assessment['issues'] = fitIssues(item, profile).map(text => ({ kind: 'fit' as const, text }));
  const goods: string[] = [];
  if (item.color) {
    const rec = isColorRecommended(item.color, profile.undertone);
    const name = getColorName(item.color);
    if (rec === false) issues.push({ kind: 'color', text: `${name} clashes with your ${profile.undertone} undertone` });
    if (rec === true) goods.push(`${name} suits your ${profile.undertone} undertone`);
  }
  return { avoid: issues.length > 0, issues, goods };
}
