export interface Category {
  id: string;
  name: string;
  order: number;
  parentId: string | null;
}

export interface Item {
  id: string;
  image: string;
  title: string;
  price: number;
  currency: string;
  link: string;
  notes: string;
  categoryId: string;
  createdAt: number;
  color: string;
  garmentType: 'top' | 'bottom' | 'layer' | 'accessory' | 'other';
}

export interface ColorRule {
  id: string;
  topColor: string;
  bottomColors: string[];
}

export type SortOption = 'newest' | 'oldest' | 'priceAsc' | 'priceDesc' | 'nameAsc' | 'nameDesc';

export type Gender = 'male' | 'female' | 'other';

// Overtone — visible surface skin depth
export type SkinTone = 'fair' | 'wheatish' | 'dusky' | 'dark';

// Undertone — the biological hue beneath the surface; independent of depth
export type Undertone = 'warm' | 'cool' | 'neutral' | 'olive';

// 7 seasons most relevant to Indian skin (derived from overtone × undertone)
export type ColorSeason =
  | 'warm_spring'
  | 'soft_summer'
  | 'true_autumn'
  | 'soft_autumn'
  | 'deep_autumn'
  | 'true_winter'
  | 'deep_winter';

export type MaleBodyType = 'rectangle' | 'trapezoid' | 'oval' | 'triangle' | 'square';
export type FemaleBodyType = 'hourglass' | 'apple' | 'pear' | 'rectangle' | 'inverted_triangle';
export type BodyType = MaleBodyType | FemaleBodyType;

export interface UserProfile {
  gender: Gender;
  skinTone: SkinTone;       // overtone
  undertone: Undertone;     // biological undertone — drives color recommendations
  bodyType: BodyType;
}

export interface UndertoneColorAdvice {
  undertone: Undertone;
  recommended: string[];
  avoid: string[];
}

export interface BodyTypeAdvice {
  bodyType: BodyType;
  gender: Gender;
  label: string;
  description: string;
  recommendedFits: string[];
  avoidFits: string[];
  tips: string[];
  indianWear: {
    recommended: string[];
    avoid: string[];
    tips: string[];
  };
}
