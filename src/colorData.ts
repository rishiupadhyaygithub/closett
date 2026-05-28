import { ColorRule, Undertone, UndertoneColorAdvice } from './types';

export const COLOR_PALETTE = [
  // Neutrals
  { id: 'white',      name: 'White',      hex: '#F5F5F5', group: 'neutral' },
  { id: 'cream',      name: 'Cream',      hex: '#F5F0E8', group: 'neutral' },
  { id: 'cloud',      name: 'Cloud',      hex: '#C8C4BF', group: 'neutral' },
  { id: 'grey',       name: 'Grey',       hex: '#808080', group: 'neutral' },
  { id: 'charcoal',   name: 'Charcoal',   hex: '#3D3830', group: 'neutral' },
  { id: 'black',      name: 'Black',      hex: '#1A1814', group: 'neutral' },
  { id: 'beige',      name: 'Beige',      hex: '#D5C4A1', group: 'neutral' },
  // Blues
  { id: 'turquoise',  name: 'Turquoise',  hex: '#40BFA5', group: 'blue' },
  { id: 'sky',        name: 'Sky Blue',   hex: '#87CEEB', group: 'blue' },
  { id: 'azure',      name: 'Azure',      hex: '#3B82C4', group: 'blue' },
  { id: 'cobalt',     name: 'Cobalt',     hex: '#0047AB', group: 'blue' },
  { id: 'navy_blue',  name: 'Navy',       hex: '#1C2841', group: 'blue' },
  // Greens
  { id: 'teal',       name: 'Teal',       hex: '#008080', group: 'green' },
  { id: 'jade',       name: 'Jade',       hex: '#00A86B', group: 'green' },
  { id: 'emerald',    name: 'Emerald',    hex: '#50C878', group: 'green' },
  { id: 'olive_green',name: 'Olive',      hex: '#4B5320', group: 'green' },
  { id: 'forest',     name: 'Forest',     hex: '#228B22', group: 'green' },
  // Reds & Pinks
  { id: 'coral',      name: 'Coral',      hex: '#FF6B6B', group: 'red' },
  { id: 'salmon',     name: 'Salmon',     hex: '#FA8072', group: 'red' },
  { id: 'punch',      name: 'Punch',      hex: '#DE3163', group: 'red' },
  { id: 'ruby',       name: 'Ruby',       hex: '#9B111E', group: 'red' },
  { id: 'maroon',     name: 'Maroon',     hex: '#5E2129', group: 'red' },
  { id: 'magenta',    name: 'Magenta',    hex: '#CC0066', group: 'red' },
  // Purples
  { id: 'berry',      name: 'Berry',      hex: '#8E4585', group: 'purple' },
  { id: 'violet',     name: 'Violet',     hex: '#6B2FA0', group: 'purple' },
  { id: 'eggplant',   name: 'Eggplant',   hex: '#614051', group: 'purple' },
  { id: 'wine',       name: 'Wine',       hex: '#722F37', group: 'purple' },
  { id: 'burgundy',   name: 'Burgundy',   hex: '#800020', group: 'purple' },
  // Oranges & Yellows
  { id: 'yellow',     name: 'Yellow',     hex: '#FFD700', group: 'warm' },
  { id: 'amber',      name: 'Amber',      hex: '#FFBF00', group: 'warm' },
  { id: 'orange',     name: 'Orange',     hex: '#FF8C00', group: 'warm' },
  { id: 'flame',      name: 'Flame',      hex: '#E25822', group: 'warm' },
  // Browns
  { id: 'brown',      name: 'Brown',      hex: '#5C4033', group: 'brown' },
  { id: 'caramel',    name: 'Caramel',    hex: '#C68642', group: 'brown' },
  { id: 'tan',        name: 'Tan',        hex: '#D2B48C', group: 'brown' },
] as const;

export const DEFAULT_COLOR_RULES: ColorRule[] = [
  { id: 'rule_white',      topColor: 'white',      bottomColors: ['navy_blue', 'black', 'grey', 'beige', 'cobalt', 'olive_green', 'maroon', 'teal', 'burgundy', 'forest', 'jade', 'charcoal'] },
  { id: 'rule_cream',      topColor: 'cream',      bottomColors: ['navy_blue', 'brown', 'maroon', 'olive_green', 'burgundy', 'teal', 'jade', 'black', 'charcoal'] },
  { id: 'rule_black',      topColor: 'black',      bottomColors: ['white', 'cream', 'grey', 'navy_blue', 'cobalt', 'beige', 'ruby', 'burgundy', 'amber', 'teal'] },
  { id: 'rule_grey',       topColor: 'grey',       bottomColors: ['navy_blue', 'white', 'black', 'maroon', 'burgundy', 'cobalt', 'ruby', 'charcoal'] },
  { id: 'rule_charcoal',   topColor: 'charcoal',   bottomColors: ['white', 'cream', 'grey', 'navy_blue', 'cobalt', 'beige'] },
  { id: 'rule_beige',      topColor: 'beige',      bottomColors: ['navy_blue', 'brown', 'maroon', 'burgundy', 'black', 'olive_green', 'teal'] },
  { id: 'rule_navy_blue',  topColor: 'navy_blue',  bottomColors: ['white', 'cream', 'beige', 'grey', 'black', 'cobalt'] },
  { id: 'rule_cobalt',     topColor: 'cobalt',     bottomColors: ['white', 'cream', 'black', 'grey', 'beige'] },
  { id: 'rule_azure',      topColor: 'azure',      bottomColors: ['white', 'cream', 'black', 'grey', 'beige', 'navy_blue'] },
  { id: 'rule_sky',        topColor: 'sky',        bottomColors: ['white', 'cream', 'black', 'grey', 'navy_blue', 'cobalt'] },
  { id: 'rule_turquoise',  topColor: 'turquoise',  bottomColors: ['white', 'cream', 'black', 'navy_blue', 'grey', 'charcoal'] },
  { id: 'rule_olive_green',topColor: 'olive_green',bottomColors: ['white', 'cream', 'black', 'beige', 'brown', 'navy_blue', 'tan'] },
  { id: 'rule_forest',     topColor: 'forest',     bottomColors: ['white', 'cream', 'black', 'beige', 'brown', 'tan'] },
  { id: 'rule_jade',       topColor: 'jade',       bottomColors: ['white', 'cream', 'black', 'navy_blue', 'grey', 'charcoal'] },
  { id: 'rule_emerald',    topColor: 'emerald',    bottomColors: ['white', 'cream', 'black', 'navy_blue', 'charcoal'] },
  { id: 'rule_teal',       topColor: 'teal',       bottomColors: ['white', 'cream', 'black', 'navy_blue', 'grey', 'beige', 'charcoal'] },
  { id: 'rule_coral',      topColor: 'coral',      bottomColors: ['white', 'cream', 'navy_blue', 'black', 'teal', 'grey'] },
  { id: 'rule_salmon',     topColor: 'salmon',     bottomColors: ['white', 'cream', 'navy_blue', 'black', 'grey', 'charcoal'] },
  { id: 'rule_punch',      topColor: 'punch',      bottomColors: ['black', 'white', 'cream', 'navy_blue', 'grey'] },
  { id: 'rule_ruby',       topColor: 'ruby',       bottomColors: ['black', 'white', 'cream', 'navy_blue', 'grey', 'charcoal'] },
  { id: 'rule_maroon',     topColor: 'maroon',     bottomColors: ['white', 'cream', 'beige', 'black', 'grey', 'navy_blue'] },
  { id: 'rule_magenta',    topColor: 'magenta',    bottomColors: ['black', 'white', 'cream', 'navy_blue', 'grey'] },
  { id: 'rule_burgundy',   topColor: 'burgundy',   bottomColors: ['white', 'cream', 'beige', 'black', 'grey', 'navy_blue'] },
  { id: 'rule_wine',       topColor: 'wine',       bottomColors: ['white', 'cream', 'beige', 'black', 'grey', 'charcoal'] },
  { id: 'rule_berry',      topColor: 'berry',      bottomColors: ['black', 'white', 'cream', 'navy_blue', 'grey'] },
  { id: 'rule_violet',     topColor: 'violet',     bottomColors: ['black', 'white', 'cream', 'grey', 'charcoal'] },
  { id: 'rule_eggplant',   topColor: 'eggplant',   bottomColors: ['white', 'cream', 'beige', 'black', 'grey'] },
  { id: 'rule_orange',     topColor: 'orange',     bottomColors: ['white', 'cream', 'black', 'navy_blue', 'teal', 'grey'] },
  { id: 'rule_amber',      topColor: 'amber',      bottomColors: ['white', 'cream', 'black', 'navy_blue', 'brown', 'charcoal'] },
  { id: 'rule_flame',      topColor: 'flame',      bottomColors: ['white', 'cream', 'black', 'navy_blue', 'grey', 'charcoal'] },
  { id: 'rule_yellow',     topColor: 'yellow',     bottomColors: ['white', 'cream', 'black', 'navy_blue', 'grey', 'charcoal'] },
  { id: 'rule_brown',      topColor: 'brown',      bottomColors: ['white', 'cream', 'beige', 'black', 'navy_blue', 'olive_green', 'tan'] },
  { id: 'rule_caramel',    topColor: 'caramel',    bottomColors: ['white', 'cream', 'black', 'navy_blue', 'brown', 'charcoal'] },
  { id: 'rule_tan',        topColor: 'tan',        bottomColors: ['white', 'cream', 'black', 'navy_blue', 'brown', 'olive_green'] },
  { id: 'rule_cloud',      topColor: 'cloud',      bottomColors: ['navy_blue', 'black', 'charcoal', 'maroon', 'burgundy', 'teal'] },
];

// ── Undertone-based color advice ──────────────────────────────────────────────
// Undertone (warm/cool/neutral/olive) is biologically independent of skin depth.
// These recommendations are based on the 16-season color analysis framework
// adapted for Indian skin tones.

export const UNDERTONE_COLOR_ADVICE: UndertoneColorAdvice[] = [
  {
    undertone: 'warm',
    // Autumn & Spring palettes — earthy, golden, warm spectrum
    recommended: [
      'cream', 'beige', 'tan', 'caramel', 'brown',
      'olive_green', 'forest', 'jade', 'teal', 'emerald',
      'coral', 'salmon', 'maroon', 'ruby', 'wine', 'burgundy',
      'amber', 'orange', 'flame', 'yellow',
    ],
    avoid: ['violet', 'berry', 'magenta', 'cobalt', 'cloud'],
  },
  {
    undertone: 'cool',
    // Winter & Summer palettes — jewel tones, cool blues/greens, cool reds
    recommended: [
      'white', 'grey', 'charcoal', 'black',
      'cobalt', 'navy_blue', 'azure', 'sky', 'turquoise',
      'teal', 'jade', 'emerald',
      'punch', 'ruby', 'magenta', 'berry', 'violet',
      'eggplant', 'burgundy', 'wine',
    ],
    avoid: ['amber', 'orange', 'flame', 'yellow', 'caramel', 'tan', 'beige', 'salmon', 'brown'],
  },
  {
    undertone: 'neutral',
    // Most colors flatter — avoid extremes at either end of the warm/cool spectrum
    recommended: [
      'white', 'cream', 'grey', 'charcoal', 'black',
      'navy_blue', 'cobalt', 'teal', 'jade', 'emerald',
      'ruby', 'maroon', 'burgundy', 'wine', 'coral',
      'olive_green', 'forest',
    ],
    avoid: ['orange', 'flame', 'caramel', 'violet', 'magenta'],
  },
  {
    undertone: 'olive',
    // Rich muted tones — warm-cool bridge; green-yellow base; avoid icy/bright extremes
    recommended: [
      'cream', 'beige', 'olive_green', 'forest', 'teal', 'jade', 'emerald',
      'wine', 'burgundy', 'eggplant', 'maroon', 'brown', 'caramel',
      'coral', 'amber',
    ],
    avoid: ['magenta', 'violet', 'sky', 'cloud', 'yellow', 'salmon'],
  },
];

export function getColorName(id: string): string {
  return COLOR_PALETTE.find((c) => c.id === id)?.name || id;
}

export function getColorHex(id: string): string {
  return COLOR_PALETTE.find((c) => c.id === id)?.hex || '#808080';
}

export function getUndertoneAdvice(undertone: Undertone): UndertoneColorAdvice | undefined {
  return UNDERTONE_COLOR_ADVICE.find(a => a.undertone === undertone);
}

// Returns true (recommended) | false (avoid) | null (neutral / no profile)
export function isColorRecommended(colorId: string, undertone: Undertone | null): boolean | null {
  if (!undertone) return null;
  const advice = getUndertoneAdvice(undertone);
  if (!advice) return null;
  if (advice.recommended.includes(colorId)) return true;
  if (advice.avoid.includes(colorId)) return false;
  return null;
}
