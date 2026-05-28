import { BodyTypeAdvice, Gender, BodyType } from './types';

export const BODY_TYPE_ADVICE: BodyTypeAdvice[] = [
  // ── Male ──────────────────────────────────────────────────────────────────
  {
    bodyType: 'rectangle',
    gender: 'male',
    label: 'Rectangle',
    description: 'Shoulders, chest, and hips roughly equal width. Athletic but no defined waist.',
    recommendedFits: [
      'Layered looks (jacket over shirt)',
      'Structured blazers',
      'Slim-fit (not skinny) trousers',
      'Horizontal stripes and bold patterns',
      'Fitted shirts with chest pockets',
    ],
    avoidFits: [
      'Shapeless oversized fits',
      'Skinny jeans',
      'Baggy tops with tapered bottoms',
    ],
    tips: [
      'Layers create visual dimension where there is none naturally',
      'Blazers define the shoulder-to-waist ratio',
      'Chinos and slim-straight jeans over skinny cuts',
    ],
    indianWear: {
      recommended: [
        'Bandhgala / structured sherwani — defines chest and shoulder',
        'Fitted Nehru jacket over kurta',
        'Indo-Western layered jacket sets',
        'Bold embroidery or print on upper kurta to create visual width',
        'Slim churidars or fitted pyjamas',
      ],
      avoid: [
        'Shapeless long kurtas with no structure',
        'Very baggy pyjamas that create a formless silhouette',
      ],
      tips: [
        'Structured bandhgala defines shoulder-to-waist ratio better than any Western jacket',
        'Short to mid-length kurta with slim churidar is the sharpest look for this shape',
        'Horizontal embroidery bands across the chest add width and dimension',
      ],
    },
  },
  {
    bodyType: 'trapezoid',
    gender: 'male',
    label: 'Trapezoid',
    description: 'Broad shoulders, defined chest, narrower waist and hips. The classic athletic V-shape.',
    recommendedFits: [
      'Well-fitted tops (not tight)',
      'Slim-straight trousers',
      'V-necks and crew necks',
      'Simple clean-cut shirts',
      'Straight-leg jeans',
    ],
    avoidFits: [
      'Shoulder padding or epaulettes',
      'Very broad patterns across the chest',
      'Skinny jeans (creates top-heavy imbalance)',
    ],
    tips: [
      'You carry most silhouettes naturally — keep it simple',
      'Avoid adding bulk to the shoulder area',
      'Slim-straight is your best trouser cut',
    ],
    indianWear: {
      recommended: [
        'Achkan — elongates and balances the V-shape',
        'Indo-Western kurta with slim-fit jacket',
        'Well-fitted kurta, not too tight',
        'Simple sherwanis without heavy shoulder embellishment',
        'Slim churidars or straight-cut pyjamas',
      ],
      avoid: [
        'Heavy embellishment or structured padding on shoulders',
        'Very broad pattern across the chest yoke',
        'Oversized or boxy kurtas',
      ],
      tips: [
        'You carry sherwanis and achkans naturally — keep the fit clean and tailored',
        'Avoid embellishments that add bulk above the waist',
        'Dark-to-light color gradient (darker top, lighter bottom) keeps the look balanced',
      ],
    },
  },
  {
    bodyType: 'oval',
    gender: 'male',
    label: 'Oval',
    description: 'Fuller rounded midsection, narrower shoulders and hips. Weight carried in the stomach.',
    recommendedFits: [
      'Vertical stripes',
      'Monochrome outfits (one colour top to bottom)',
      'Straight-cut trousers',
      'Longer untucked shirts',
      'Dark solid colours',
    ],
    avoidFits: [
      'Horizontal stripes',
      'Tight-fitting tops',
      'Tucked-in shirts',
      'Clingy fabrics',
      'Cropped or short tops',
    ],
    tips: [
      'Monochrome elongates the body vertically',
      'Longer shirt hem covers the midsection naturally',
      'Dark bottoms draw the eye down and slim the lower half',
    ],
    indianWear: {
      recommended: [
        'Long sherwani with vertical button line down center',
        'Dark monochrome angrakha-style kurtas',
        'A-line or straight-cut long kurta (thigh-length or longer)',
        'Bandhgala with vertical embroidery panels',
        'Slim straight pyjamas in dark tones',
      ],
      avoid: [
        'Ornate embellishment at the midsection',
        'Very short kurtas that expose the waistband',
        'Tight or clingy kurta fabrics',
        'Horizontal embroidery bands across the stomach',
      ],
      tips: [
        'Vertical buttons on sherwani create a powerful elongating line',
        'Dark monochrome head-to-toe is the most slimming Indian look',
        'Angrakha style wraps to the side — the diagonal line slims the midsection',
      ],
    },
  },
  {
    bodyType: 'triangle',
    gender: 'male',
    label: 'Triangle',
    description: 'Narrower shoulders, wider hips and thighs. Weight sits below the waist.',
    recommendedFits: [
      'Structured or padded shoulders',
      'Bold patterns and details on top',
      'Darker bottoms',
      'Layering on top (jackets, overshirts)',
      'Bootcut or straight-leg trousers',
    ],
    avoidFits: [
      'Pleated trousers (add hip volume)',
      'Wide-leg pants',
      'Busy patterns or bright colours on bottom',
      'Skinny tapered trousers',
    ],
    tips: [
      'Draw attention upward with bold top choices',
      'Dark trousers slim the hip-thigh area',
      'Structured blazers balance the shoulder line',
    ],
    indianWear: {
      recommended: [
        'Structured or padded-shoulder sherwani',
        'Longer kurta with bold embroidery on upper yoke',
        'Indo-Western jacket with embellished shoulders',
        'Dark slim churidars or fitted pyjamas',
        'Layered look — kurta with a statement jacket on top',
      ],
      avoid: [
        'Pleated wide-cut pyjamas that add hip volume',
        'Embellishment concentrated at hips or below',
        'Bright or printed bottoms',
        'Boxy kurtas without structure',
      ],
      tips: [
        'Draw the eye up — embroidery, prints, and bold color belong on the top half',
        'Dark slim churidars visually compress the hip-thigh area',
        'A structured bandhgala or jacket adds instant shoulder presence',
      ],
    },
  },
  {
    bodyType: 'square',
    gender: 'male',
    label: 'Square',
    description: 'Broad stocky build — similar width across shoulders, chest, waist, and hips.',
    recommendedFits: [
      'Vertical stripes',
      'Slim-fit (not skinny) cuts',
      'Single-breasted jackets',
      'V-neck tops',
      'Dark monochrome outfits',
    ],
    avoidFits: [
      'Boxy oversized fits',
      'Horizontal patterns',
      'Double-breasted jackets',
      'Baggy everything',
    ],
    tips: [
      'Vertical lines create length and a leaner silhouette',
      'Avoid anything that adds bulk',
      'Dark colours slim the entire silhouette',
    ],
    indianWear: {
      recommended: [
        'Dark slim-fit sherwanis with vertical button line',
        'Single-breasted kurta jacket (no double-breast)',
        'V-neck kurtas that open the chest',
        'Vertical embroidery or pintuck panels',
        'Dark monochrome kurta + pyjama sets',
      ],
      avoid: [
        'Boxy oversized kurtas',
        'Double-breasted bandhgalas',
        'Heavy horizontal embellishment across the chest or hips',
        'Baggy pyjamas that add bulk to the lower half',
      ],
      tips: [
        'Vertical details — buttons, pintucks, embroidery panels — are your best styling tool',
        'Single-breasted always over double-breasted for this shape',
        'Dark colour from collar to toe is the most powerful slimming choice',
      ],
    },
  },

  // ── Female ────────────────────────────────────────────────────────────────
  {
    bodyType: 'hourglass',
    gender: 'female',
    label: 'Hourglass',
    description: 'Defined waist, with bust and hips roughly equal in width.',
    recommendedFits: [
      'Fitted and wrap-style tops',
      'Belted dresses and skirts',
      'Bodycon cuts',
      'Pencil skirts',
      'A-line silhouettes',
    ],
    avoidFits: [
      'Boxy or shapeless tops',
      'Oversized and baggy styles',
      'Sack or tent dresses',
    ],
    tips: [
      'Your waist is the focal point — highlight it always',
      'Wrap dresses are built for this shape',
      'Avoid anything that hides the waist definition',
    ],
    indianWear: {
      recommended: [
        'Nivi drape saree with well-fitted, waist-defining blouse',
        'Wrap-style kurtas cinched at the waist',
        'Belted Anarkali (fitted bodice, flared skirt)',
        'Lehenga with corset or sweetheart blouse — cinched waist',
        'Churidar or fitted leggings with a close-fit kameez',
      ],
      avoid: [
        'Shapeless straight-cut kurtas with no waist seam',
        'Very loose Patiala salwars that hide the waist',
        'Box-cut kurtis that fall straight from shoulder to hem',
      ],
      tips: [
        'Belt a saree at the waist for a dramatic, contemporary look',
        'Sweetheart, boat-neck, and V-neck blouses all complement this shape equally',
        'Corset blouses for lehengas are your signature piece',
      ],
    },
  },
  {
    bodyType: 'apple',
    gender: 'female',
    label: 'Apple',
    description: 'Fuller midsection, slimmer legs and arms, less defined waist.',
    recommendedFits: [
      'Empire-waist tops and dresses',
      'A-line skirts and dresses',
      'Flowy and draped tops',
      'Straight-leg trousers',
      'V-necks to draw the eye up',
    ],
    avoidFits: [
      'Clingy fabrics around the midsection',
      'High-waisted bottoms',
      'Crop tops',
      'Horizontal details at the waist',
    ],
    tips: [
      'Draw attention to legs and neckline, away from midsection',
      'Empire waist falls before the midsection — very flattering',
      'Dark tops elongate and draw the eye upward',
    ],
    indianWear: {
      recommended: [
        'Empire-waist Anarkali or floor-length A-line kurta',
        'Seedha pallu saree drape — creates a clean vertical line',
        'Chiffon or georgette sarees in dark tones with narrow pleats (5–7)',
        'V-neck or deep round-neck blouses',
        'Indo-Western long jacket set over a kurta or dress',
        'Vertical embroidery panel down the center front of kurta',
      ],
      avoid: [
        'Ruched or gathered waistbands',
        'Peplum blouses',
        'Tight or clingy churidars alone without a long kameez',
        'Horizontal embellishment or border across the midsection',
        'Heavily embellished waistbands on lehengas',
      ],
      tips: [
        'Narrow neat pleats (5–7) in a saree keep the midsection clean — avoid wide pleats',
        'Dark chiffon or georgette sarees drape beautifully and are naturally slimming',
        'Long jacket sets are a modern best friend — the jacket skims past the midsection',
      ],
    },
  },
  {
    bodyType: 'pear',
    gender: 'female',
    label: 'Pear',
    description: 'Wider hips and thighs, narrower shoulders and bust. The most common Indian female body shape.',
    recommendedFits: [
      'A-line skirts and dresses',
      'Structured shoulders and statement tops',
      'Patterns and details on top',
      'Darker bottoms',
      'Wide-leg trousers',
    ],
    avoidFits: [
      'Skinny jeans worn alone',
      'Tight or patterned bottoms',
      'Busy patterns on hips',
      'Tapered ankle cuts',
    ],
    tips: [
      'Balance by adding volume and detail on top',
      'Dark bottoms slim the hip-thigh area',
      'A-line silhouettes hide the hip-thigh ratio beautifully',
    ],
    indianWear: {
      recommended: [
        'Floor-length Anarkali suit — the single most flattering Indian outfit for this shape',
        'A-line kurta with bold embellished neckline or yoke',
        'Nivi saree drape with statement blouse (puff sleeves, embellished, boat neck)',
        'A-line or fishtail lehenga with heavily embellished fitted choli',
        'Straight-cut salwar (not tapered) with longline kameez',
        'Cape-style kurta over leggings',
      ],
      avoid: [
        'Heavily embellished hips on lehenga or saree border',
        'Tapered salwars that hug the thighs',
        'Mermaid-cut lehengas that flare exactly at the widest point',
        'Patterned or printed bottoms',
      ],
      tips: [
        'Anarkali suits are engineered for this shape — buy multiple',
        'Statement sleeves (puff, flutter, bishop) broaden the shoulder visually',
        'Choose embellished necklines and yokes to draw the eye upward',
        'Lightweight saree fabrics (chiffon, georgette, chanderi) drape better on hips than heavy silk',
      ],
    },
  },
  {
    bodyType: 'rectangle',
    gender: 'female',
    label: 'Rectangle',
    description: 'Minimal curves — waist is not much smaller than bust or hips. Straight silhouette.',
    recommendedFits: [
      'Peplum tops',
      'Ruffles and frills',
      'Layered outfits',
      'Belts at the natural waist',
      'Horizontal stripes to add width',
    ],
    avoidFits: [
      'Straight-cut shapeless dresses',
      'Column silhouettes',
    ],
    tips: [
      'Create curves with volume and detail',
      'A belt at the natural waist adds the illusion of shape',
      'Ruffles and peplum add dimension where there is none',
    ],
    indianWear: {
      recommended: [
        'Peplum kurta — adds hip flare and waist definition in one',
        'Belted saree (belt worn at natural waist over the saree)',
        'Ruffled or layered sarees with flared hems',
        'Heavily flared lehenga skirt with corset or peplum blouse',
        'Sharara and gharara — flared bottoms create instant hip curve',
        'Anarkali with nipped-in waist (not free-flowing)',
      ],
      avoid: [
        'Straight-cut everything — straight kurta + straight pyjama + straight dupatta',
        'Column or sheath silhouettes',
        'Sarees draped with no tuck or belt that fall straight',
      ],
      tips: [
        'The belt is your most powerful accessory — wear it at the narrowest point',
        'Flared lehenga skirts and shararas create the hip curve your shape doesn\'t naturally have',
        'Ruffles and pintucks on blouses add dimension to the bust',
      ],
    },
  },
  {
    bodyType: 'inverted_triangle',
    gender: 'female',
    label: 'Inverted Triangle',
    description: 'Broad shoulders and bust, narrower waist and hips.',
    recommendedFits: [
      'A-line and flared skirts',
      'Wide-leg trousers',
      'Patterns and bold details on bottom',
      'V-necklines',
      'Halter and wrap tops',
    ],
    avoidFits: [
      'Puffed or structured sleeves',
      'Boat necklines',
      'Horizontal stripes across the chest',
      'Off-shoulder tops',
    ],
    tips: [
      'Add volume below the waist to balance broad shoulders',
      'V-necklines narrow the appearance of the chest',
      'Bold bottoms draw the eye downward and balance the silhouette',
    ],
    indianWear: {
      recommended: [
        'Bengali-style saree drape — adds volume to the lower body with full pleats',
        'Sharara and gharara — the flared pant balances broad shoulders perfectly',
        'Heavily embellished, flared lehenga skirt with a plain or V-neck choli',
        'A-line or flared skirt with embellished border',
        'Plain simple blouses with deep V-neck to narrow the chest visually',
      ],
      avoid: [
        'Heavily embellished blouses with structured or puff shoulders',
        'Boat-neck blouses (widens the shoulder line)',
        'Off-shoulder or strapless cholis',
        'Embellishment concentrated at shoulder or chest area',
      ],
      tips: [
        'Rule of thumb: plain simple top, heavily embellished bottom',
        'V-necklines on blouses visually narrow the chest width',
        'Sharara and gharara are the most balanced Indian silhouette for this shape',
      ],
    },
  },
];

export function getBodyTypeAdvice(bodyType: BodyType, gender: Gender): BodyTypeAdvice | undefined {
  // Exact match first
  const exact = BODY_TYPE_ADVICE.find(a => a.bodyType === bodyType && a.gender === gender);
  if (exact) return exact;
  // For gender='other', fall back to matching bodyType regardless of gender
  return BODY_TYPE_ADVICE.find(a => a.bodyType === bodyType);
}

export const MALE_BODY_TYPES = BODY_TYPE_ADVICE
  .filter(a => a.gender === 'male')
  .map(a => ({ id: a.bodyType, label: a.label, description: a.description }));

export const FEMALE_BODY_TYPES = BODY_TYPE_ADVICE
  .filter(a => a.gender === 'female')
  .map(a => ({ id: a.bodyType, label: a.label, description: a.description }));
