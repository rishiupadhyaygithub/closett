import { SkinTone, Undertone, ColorSeason } from './types';

export interface SeasonInfo {
  id: ColorSeason;
  name: string;
  tagline: string;
  description: string;
  bestColors: string[];   // descriptive color names (not palette IDs)
  avoidColors: string[];
  metals: string[];
  indianFrequency: 'very common' | 'common' | 'moderate' | 'rare';
  contrastLevel: 'high' | 'medium' | 'low';
}

export const SEASON_INFO: Record<ColorSeason, SeasonInfo> = {
  warm_spring: {
    id: 'warm_spring',
    name: 'Warm Spring',
    tagline: 'Fresh, sunny, and clear',
    description: 'Light-medium wheatish/fair skin with clearly warm-golden undertones. Your palette is bright and warm — coral, peach, golden yellow, turquoise, ivory.',
    bestColors: ['Coral', 'Peach', 'Apricot', 'Marigold', 'Golden Yellow', 'Turquoise', 'Tomato Red', 'Camel', 'Ivory', 'Warm Beige', 'Salmon'],
    avoidColors: ['Jet Black', 'Navy', 'Icy Pastels', 'Dusty Earth Tones', 'Burgundy', 'Muted Purples'],
    metals: ['Yellow Gold', 'Rose Gold', 'Brass'],
    indianFrequency: 'moderate',
    contrastLevel: 'medium',
  },
  soft_summer: {
    id: 'soft_summer',
    name: 'Soft Summer',
    tagline: 'Muted, cool, and understated',
    description: 'Medium wheatish-to-olive skin with cool-neutral undertones and naturally low-contrast, "dusty" features. Muted, smoky tones suit you best.',
    bestColors: ['Dusty Rose', 'Sage Green', 'Soft Mauve', 'Slate Blue', 'Dove Grey', 'Smoky Teal', 'Cool Taupe', 'Soft Burgundy', 'Dusty Lavender'],
    avoidColors: ['Bright Neon', 'Hot Pink', 'Pure White', 'Jet Black', 'Warm Oranges', 'Golden Yellow'],
    metals: ['Silver', 'White Gold', 'Brushed Platinum'],
    indianFrequency: 'moderate',
    contrastLevel: 'low',
  },
  true_autumn: {
    id: 'true_autumn',
    name: 'True Autumn',
    tagline: 'Warm, rich, and earthy',
    description: 'Wheatish skin with strong golden-warm undertones — the classic Indian gold tone. Your palette is the Indian festive wardrobe: mustard, rust, terracotta, olive, marigold.',
    bestColors: ['Burnt Orange', 'Terracotta', 'Mustard Yellow', 'Olive Green', 'Rust', 'Warm Camel', 'Cinnamon', 'Marigold', 'Warm Chocolate', 'Honey', 'Bronze'],
    avoidColors: ['Icy Pastels', 'Fuchsia', 'Pure White', 'Cool Blues', 'Jet Black', 'Neon Brights', 'Cool Magenta'],
    metals: ['Yellow Gold', 'Rose Gold', 'Antique Copper', 'Brass', 'Bronze'],
    indianFrequency: 'very common',
    contrastLevel: 'medium',
  },
  soft_autumn: {
    id: 'soft_autumn',
    name: 'Soft Autumn',
    tagline: 'Warm, muted, and hazy',
    description: 'Wheatish to olive skin with warm-neutral or olive undertones and softer, muted feature coloring. Your palette is the same warm earth tones as Autumn but slightly toned down.',
    bestColors: ['Warm Taupe', 'Dusty Terracotta', 'Muted Olive', 'Warm Sage', 'Camel', 'Soft Rust', 'Warm Beige', 'Muted Coral', 'Dusty Peach'],
    avoidColors: ['Bright Neon', 'Pure White', 'Icy Pastels', 'Hot Pink', 'Electric Blue', 'High-contrast Black-White'],
    metals: ['Antique Gold', 'Brushed Bronze', 'Rose Gold'],
    indianFrequency: 'common',
    contrastLevel: 'low',
  },
  deep_autumn: {
    id: 'deep_autumn',
    name: 'Deep Autumn',
    tagline: 'Rich, deep, and warm',
    description: 'Medium-deep to deep skin with warm-golden undertones. The richest Autumn — espresso, dark teal, forest, burgundy, mahogany. Your palette has the weight of Indian luxury fabrics.',
    bestColors: ['Espresso', 'Dark Chocolate', 'Deep Teal', 'Forest Green', 'Pine', 'Burgundy', 'Mahogany', 'Deep Plum', 'Terracotta', 'Warm Navy', 'Deep Mustard', 'Rust', 'Oxblood', 'Antique Gold'],
    avoidColors: ['Icy Pastels', 'Cool Bright Blues', 'Fluorescent Shades', 'Light Pastel Pink'],
    metals: ['Yellow Gold', 'Antique Gold', 'Dark Bronze', 'Copper'],
    indianFrequency: 'very common',
    contrastLevel: 'high',
  },
  true_winter: {
    id: 'true_winter',
    name: 'True Winter',
    tagline: 'Cool, crisp, and high contrast',
    description: 'Medium skin with definitively cool undertones, dark features. Pure, high-contrast colors suit you best — true red, pure white, jet black, sapphire, emerald, fuchsia.',
    bestColors: ['True Red', 'Pure White', 'Jet Black', 'Icy Blue', 'Royal Blue', 'Fuchsia', 'Emerald', 'Lemon Yellow', 'Hot Pink', 'Cool Grey', 'Sapphire', 'Magenta', 'Charcoal'],
    avoidColors: ['Warm Gold', 'Peach', 'Orange', 'Olive', 'Mustard', 'Warm Cream', 'Ivory', 'Beige'],
    metals: ['Silver', 'White Gold', 'Platinum'],
    indianFrequency: 'moderate',
    contrastLevel: 'high',
  },
  deep_winter: {
    id: 'deep_winter',
    name: 'Deep Winter',
    tagline: 'Jewel tones, dramatic, and cool',
    description: 'Medium-deep to deep skin with cool undertones — a season often mistaken for warm. Jewel tones were made for you.',
    bestColors: ['Emerald Green', 'Sapphire Blue', 'Ruby Red', 'Royal Purple', 'True Black', 'Pure White', 'Icy Pink', 'Magenta', 'Fuchsia', 'Cobalt', 'Deep Teal', 'Ink Blue', 'Hot Pink'],
    avoidColors: ['Mustard', 'Orange', 'Warm Camel', 'Peach', 'Beige', 'Warm Brown', 'Dusty Earth Tones', 'Muted Warm Shades'],
    metals: ['Silver', 'White Gold', 'Platinum', 'Cool Rose Gold'],
    indianFrequency: 'very common',
    contrastLevel: 'high',
  },
};

// Derive color season from overtone × undertone
// Based on Indian skin → season mapping from the 16-season color analysis research
export function deriveColorSeason(skinTone: SkinTone, undertone: Undertone): ColorSeason {
  const map: Record<SkinTone, Record<Undertone, ColorSeason>> = {
    fair:     { warm: 'warm_spring',  cool: 'true_winter',  neutral: 'soft_summer', olive: 'soft_autumn' },
    wheatish: { warm: 'true_autumn',  cool: 'soft_summer',  neutral: 'soft_autumn', olive: 'soft_autumn' },
    dusky:    { warm: 'deep_autumn',  cool: 'deep_winter',  neutral: 'deep_autumn', olive: 'deep_autumn' },
    dark:     { warm: 'deep_autumn',  cool: 'deep_winter',  neutral: 'deep_autumn', olive: 'deep_autumn' },
  };
  return map[skinTone][undertone];
}
