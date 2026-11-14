/**
 * Assigns animal and subcategory from shop category paths and product titles by keywords.
 * Returns null where it isn't clear – the product then shows up in the admin queue
 * instead of in a wrong category. Pure module.
 */

export type AnimalSlug = "hund" | "katze" | "kleintiere" | "voegel" | "aquaristik" | "terraristik" | "pferd" | "sonstiges";
export type SubcategorySlug =
  | "trockenfutter"
  | "nassfutter"
  | "snacks"
  | "streu"
  | "spielzeug"
  | "zubehoer"
  | "pflege"
  | "gesundheit";

// Word stems (matched against folded text: ä→ae etc.). Order = priority when several match
// within the "food flavour" problem: "Katzenfutter mit Fisch" is cat, not aquaristics.
const ANIMAL_KEYWORDS: Array<[AnimalSlug, RegExp]> = [
  ["katze", /\b(katze|katzen|kitten|kater|cat|cats|feline)/],
  ["hund", /\b(hund|hunde|welpe|welpen|puppy|dog|dogs|canine)/],
  ["kleintiere", /\b(kaninchen|meerschwein|hamster|nager|kleintier|chinchilla|degu|ratte|ratten|maus|maeuse|frettchen|rennmaus)/],
  ["voegel", /\b(vogel|voegel|wellensittich|papagei|kanarien|sittich|wildvogel|nymphensittich|meisenknoedel)/],
  ["terraristik", /\b(terrari|reptil|schildkroete|gecko|bartagame|schlange|leguan|chamaeleon)/],
  ["pferd", /\b(pferd|pferde|pony|reitsport|equine|horse)/],
  ["aquaristik", /\b(aquari|zierfisch|fischfutter|teichfisch|garnele|koi|goldfisch|wasseraufbereit)/],
];

// Generic "Fisch" as animal only when no other animal matched (cat food "mit Fisch" stays cat).
const WEAK_AQUA = /\b(fisch|fische)\b/;

const SUB_KEYWORDS: Array<[SubcategorySlug, RegExp]> = [
  ["streu", /(streu|einstreu|klumpstreu|katzenstreu|kleintierstreu|hobelspaene)/],
  ["gesundheit", /(zecken|floh|wurmkur|entwurm|ergaenzungsfutter|vitamin|gelenk|probiotik|diaetfutter|nierendiaet)/],
  ["pflege", /(shampoo|buerste|kamm|fellpflege|krallen|zahnpflege|ohrenreiniger|pflegespray)/],
  ["nassfutter", /(nassfutter|dose\b|dosen|pouch|frischebeutel|schaelchen|schale\b|pastete|ragout|in sauce|in gelee)/],
  ["trockenfutter", /(trockenfutter|kroketten|trocken\b|dry food|kibble)/],
  ["snacks", /(snack|leckerli|leckerlie|kauknochen|kausnack|kaustange|treats|dentastix|knabber|belohnung)/],
  ["spielzeug", /(spielzeug|spielball|\bball\b|toy|plueschtier|zerrspiel|katzenangel|intelligenzspiel)/],
  ["zubehoer", /(napf|naepfe|leine|halsband|geschirr|transportbox|kratzbaum|hundebett|katzenbett|korb|kaefig|katzenklo|katzentoilette|trinkbrunnen|futterautomat|aquarium\b|terrarium\b|filter|heizer|beleuchtung)/],
];

export function foldForClassify(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss");
}

export function classifyAnimal(...texts: Array<string | null | undefined>): AnimalSlug | null {
  // Try each text separately in order (shop category first, then title): the first text that
  // yields exactly one animal decides.
  for (const raw of texts) {
    if (!raw) continue;
    const t = foldForClassify(raw);
    const hits = ANIMAL_KEYWORDS.filter(([, re]) => re.test(t)).map(([slug]) => slug);
    const unique = [...new Set(hits)];
    if (unique.length === 1) return unique[0] ?? null;
    if (unique.length > 1) return null; // "für Hunde und Katzen" → let a human decide
    if (WEAK_AQUA.test(t)) return "aquaristik";
  }
  return null;
}

export function classifySubcategory(...texts: Array<string | null | undefined>): SubcategorySlug | null {
  for (const raw of texts) {
    if (!raw) continue;
    const t = foldForClassify(raw);
    for (const [slug, re] of SUB_KEYWORDS) if (re.test(t)) return slug;
  }
  return null;
}
