// Product pages name colours in words ("Light Beige", "Navy"). Map them to the app's palette ids.
const WORDS: Record<string, string> = {
  white: 'white', cream: 'cream', ivory: 'cream', ecru: 'cream',
  grey: 'grey', gray: 'grey', silver: 'cloud', charcoal: 'charcoal', black: 'black',
  beige: 'beige', khaki: 'beige', sand: 'beige', stone: 'beige', nude: 'beige', tan: 'tan',
  brown: 'brown', chocolate: 'brown', coffee: 'brown', camel: 'caramel', caramel: 'caramel',
  navy: 'navy_blue', blue: 'azure', sky: 'sky', cobalt: 'cobalt', azure: 'azure',
  teal: 'teal', turquoise: 'turquoise', aqua: 'turquoise',
  green: 'forest', olive: 'olive_green', emerald: 'emerald', jade: 'jade', mint: 'jade', forest: 'forest',
  red: 'ruby', maroon: 'maroon', burgundy: 'burgundy', wine: 'wine',
  pink: 'punch', rose: 'salmon', salmon: 'salmon', coral: 'coral', peach: 'salmon', magenta: 'magenta', fuchsia: 'magenta',
  purple: 'violet', violet: 'violet', lavender: 'violet', lilac: 'violet', berry: 'berry', plum: 'eggplant', eggplant: 'eggplant',
  yellow: 'yellow', mustard: 'amber', amber: 'amber', gold: 'amber', orange: 'orange', rust: 'flame', flame: 'flame',
};

/** Palette id for a colour name, or null when the words are not recognised. Uses the first colour word. */
export function colorFromName(name: string): string | null {
  const text = name.toLowerCase();
  if (/off[\s-]?white/.test(text)) return 'cream';
  if (/(light|baby|powder)\s+blue/.test(text)) return 'sky';
  for (const word of text.split(/[^a-z]+/)) {
    if (word && WORDS[word]) return WORDS[word];
  }
  return null;
}

/** Brand names and fabric terms that contain a colour word but say nothing about the colour. */
const NOT_A_COLOUR = /\b(?:red\s*tape|red\s*chief|red\s*wing|black\s*berrys|blackberrys|blue\s*tokai|true\s*blue|stone[\s-]*wash(?:ed)?|acid[\s-]*wash(?:ed)?)\b/gi;

/**
 * Colour for a new piece: the page's own colour when it names one, else a colour word in the
 * product title. A page "colour" that lists several (Snitch lists every variant) is ignored.
 */
export function pickColor(pageColor: string, title: string): string | null {
  const isList = /[,/|]/.test(pageColor);
  const fromPage = !isList && pageColor ? colorFromName(pageColor) : null;
  return fromPage ?? colorFromName(title.replace(NOT_A_COLOUR, ' '));
}
