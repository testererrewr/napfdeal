import assert from "node:assert/strict";
import { test } from "node:test";
import { csvRecords, parseCsv } from "./csv.ts";

async function rows(chunks: string[], delimiter?: string) {
  const out: string[][] = [];
  for await (const r of parseCsv(chunks, { delimiter })) out.push(r);
  return out;
}

test("simple rows, LF and CRLF", async () => {
  assert.deepEqual(await rows(["a,b\n1,2\r\n3,4"]), [["a", "b"], ["1", "2"], ["3", "4"]]);
});

test("quoted fields with delimiter, escaped quotes and newline", async () => {
  assert.deepEqual(await rows(['name,desc\n"Futter, 12 kg","Sag ""Hallo""\nzweite Zeile"\n']), [
    ["name", "desc"],
    ["Futter, 12 kg", 'Sag "Hallo"\nzweite Zeile'],
  ]);
});

test("chunk boundaries anywhere", async () => {
  const text = 'a,b\n"x ""y""",z\r\n1,2\n';
  const expected = await rows([text]);
  for (let i = 1; i < text.length; i++) {
    assert.deepEqual(await rows([text.slice(0, i), text.slice(i)]), expected, `split at ${i}`);
  }
});

test("empty fields and trailing delimiter", async () => {
  assert.deepEqual(await rows(["a,,c,\n"]), [["a", "", "c", ""]]);
});

test("other delimiter", async () => {
  assert.deepEqual(await rows(["a|b\n1|2"], "|"), [["a", "b"], ["1", "2"]]);
});

test("records keyed by header, BOM stripped, blank lines skipped", async () => {
  const out: Record<string, string>[] = [];
  for await (const r of csvRecords(["﻿id,name\n\n1,Napf\n2,Leine\n"])) out.push(r);
  assert.deepEqual(out, [
    { id: "1", name: "Napf" },
    { id: "2", name: "Leine" },
  ]);
});
