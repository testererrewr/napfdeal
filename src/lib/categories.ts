// Seed for categories. The database is the source of truth (editable in /admin later);
// the worker inserts missing seed rows on start and never overwrites admin changes.

import type { AnimalSlug, SubcategorySlug } from "@/lib/pricing/classify";

export const ANIMALS: ReadonlyArray<{ slug: AnimalSlug; name: string; note?: string }> = [
  { slug: "hund", name: "Hund" },
  { slug: "katze", name: "Katze" },
  { slug: "kleintiere", name: "Kleintiere", note: "Kaninchen, Meerschweinchen, Hamster und mehr" },
  { slug: "voegel", name: "Vögel" },
  { slug: "aquaristik", name: "Aquaristik" },
  { slug: "terraristik", name: "Terraristik" },
  { slug: "pferd", name: "Pferd" },
  { slug: "sonstiges", name: "Sonstiges" },
];

export const SUBCATEGORIES: ReadonlyArray<{ slug: SubcategorySlug; name: string }> = [
  { slug: "trockenfutter", name: "Trockenfutter" },
  { slug: "nassfutter", name: "Nassfutter" },
  { slug: "snacks", name: "Snacks" },
  { slug: "streu", name: "Streu & Einstreu" },
  { slug: "spielzeug", name: "Spielzeug" },
  { slug: "zubehoer", name: "Zubehör" },
  { slug: "pflege", name: "Pflege" },
  { slug: "gesundheit", name: "Gesundheit" },
];
