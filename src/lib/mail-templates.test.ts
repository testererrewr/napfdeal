import assert from "node:assert/strict";
import { test } from "node:test";
import { confirmAlertMail, layout } from "./mail-templates.ts";

test("html is escaped, text contains links", () => {
  const m = layout({ heading: "<Hallo>", paragraphs: ['a & "b"'], button: { label: "Los", url: "https://napfdeal.com/x?a=1&b=2" } });
  assert.ok(m.html.includes("&lt;Hallo&gt;"));
  assert.ok(m.html.includes("a &amp; &quot;b&quot;"));
  assert.ok(m.html.includes('href="https://napfdeal.com/x?a=1&amp;b=2"'));
  assert.ok(m.text.includes("Los: https://napfdeal.com/x?a=1&b=2"));
  assert.ok(!/<img|<script/i.test(m.html), "no images or scripts");
});

test("alert confirmation mail has manage and delete links", () => {
  const m = confirmAlertMail({
    productName: "Futter 12 kg",
    conditionText: "Gesamtpreis höchstens 40,00 €",
    confirmUrl: "https://napfdeal.com/alarm/bestaetigen/abc/",
    manageUrl: "https://napfdeal.com/alarme/def/",
    deleteDataUrl: "https://napfdeal.com/daten-loeschen/ghi/",
  });
  assert.match(m.subject, /Futter 12 kg/);
  assert.ok(m.text.includes("https://napfdeal.com/alarme/def/"));
  assert.ok(m.text.includes("https://napfdeal.com/daten-loeschen/ghi/"));
  assert.ok(m.text.includes("48 Stunden"));
});
