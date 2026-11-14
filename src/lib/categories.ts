// Seed list for animal categories. In Phase 1 this moves into the database
// (editable in /admin); this file then only provides the initial seed.

export const ANIMALS = [
  { slug: "hund", name: "Hund" },
  { slug: "katze", name: "Katze" },
  { slug: "kleintiere", name: "Kleintiere", note: "Kaninchen, Meerschweinchen, Hamster und mehr" },
  { slug: "voegel", name: "Vögel" },
  { slug: "aquaristik", name: "Aquaristik" },
  { slug: "terraristik", name: "Terraristik" },
  { slug: "pferd", name: "Pferd" },
  { slug: "sonstiges", name: "Sonstiges" },
] as const;

export const SUBCATEGORIES = [
  { slug: "trockenfutter", name: "Trockenfutter" },
  { slug: "nassfutter", name: "Nassfutter" },
  { slug: "snacks", name: "Snacks" },
  { slug: "streu", name: "Streu & Einstreu" },
  { slug: "spielzeug", name: "Spielzeug" },
  { slug: "zubehoer", name: "Zubehör" },
  { slug: "pflege", name: "Pflege" },
  { slug: "gesundheit", name: "Gesundheit" },
] as const;
