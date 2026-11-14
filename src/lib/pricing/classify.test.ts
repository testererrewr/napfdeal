import assert from "node:assert/strict";
import { test } from "node:test";
import { classifyAnimal, classifySubcategory } from "./classify.ts";

test("animals from titles", () => {
  assert.equal(classifyAnimal("Royal Canin Mini Adult Hundefutter 8 kg"), "hund");
  assert.equal(classifyAnimal("Katzenstreu Klumpstreu 10 l"), "katze");
  assert.equal(classifyAnimal("Meerschweinchen Heu 2 kg"), "kleintiere");
  assert.equal(classifyAnimal("Wellensittich Futter 1 kg"), "voegel");
  assert.equal(classifyAnimal("Bartagamen Futterinsekten"), "terraristik");
  assert.equal(classifyAnimal("Pferdeleckerli Apfel 1 kg"), "pferd");
  assert.equal(classifyAnimal("Zierfischfutter Flocken 250 ml"), "aquaristik");
});

test("cat food with fish flavour stays cat", () => {
  assert.equal(classifyAnimal("Katzenfutter mit Fisch 12 x 85 g"), "katze");
});

test("plain 'Fisch' without other animal → aquaristik", () => {
  assert.equal(classifyAnimal("Futter für Fische 100 ml"), "aquaristik");
});

test("ambiguous → null", () => {
  assert.equal(classifyAnimal("Zeckenschutz für Hunde und Katzen"), null);
});

test("shop category is tried before title", () => {
  assert.equal(classifyAnimal("Katze > Spielzeug", "Spielmaus mit Katzenminze für Hund und Katze"), "katze");
});

test("subcategories", () => {
  assert.equal(classifySubcategory("Katzenstreu Klumpstreu 10 l"), "streu");
  assert.equal(classifySubcategory("Nassfutter Rind 6 x 400 g"), "nassfutter");
  assert.equal(classifySubcategory("Pouch Lachs 12 x 85 g"), "nassfutter");
  assert.equal(classifySubcategory("Adult Trockenfutter Lamm 12 kg"), "trockenfutter");
  assert.equal(classifySubcategory("Kauknochen 24 Stück"), "snacks");
  assert.equal(classifySubcategory("Wurfspielzeug Ball"), "spielzeug");
  assert.equal(classifySubcategory("Edelstahl Napf 1,2 l"), "zubehoer");
  assert.equal(classifySubcategory("Zeckenhalsband"), "gesundheit");
  assert.equal(classifySubcategory("Fellpflege Bürste"), "pflege");
  assert.equal(classifySubcategory("Irgendwas"), null);
});
