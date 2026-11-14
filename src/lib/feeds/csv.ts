/**
 * Streaming RFC 4180 CSV parser. Feeds can have hundreds of thousands of rows, so we never
 * hold the whole file in memory. Handles quoted fields, "" escapes, CR/LF and newlines inside quotes.
 * Pure module.
 */

export type CsvOptions = { delimiter?: string };

export async function* parseCsv(chunks: AsyncIterable<string> | Iterable<string>, opts: CsvOptions = {}): AsyncGenerator<string[]> {
  const delim = opts.delimiter ?? ",";
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  let quotePending = false; // saw a quote inside a quoted field; next char decides escape vs. end
  let lastWasCR = false;
  let any = false;

  for await (const chunk of chunks) {
    for (let i = 0; i < chunk.length; i++) {
      const c = chunk[i] as string;
      any = true;

      if (inQuotes) {
        if (quotePending) {
          quotePending = false;
          if (c === '"') {
            field += '"';
            continue;
          }
          inQuotes = false; // closing quote; fall through to handle c normally
        } else if (c === '"') {
          quotePending = true;
          continue;
        } else {
          field += c;
          continue;
        }
      }

      if (c === '"' && field === "") {
        inQuotes = true;
        lastWasCR = false;
        continue;
      }
      if (c === delim) {
        row.push(field);
        field = "";
        lastWasCR = false;
        continue;
      }
      if (c === "\r") {
        row.push(field);
        field = "";
        yield row;
        row = [];
        lastWasCR = true;
        continue;
      }
      if (c === "\n") {
        if (lastWasCR) {
          lastWasCR = false;
          continue;
        }
        row.push(field);
        field = "";
        yield row;
        row = [];
        continue;
      }
      lastWasCR = false;
      field += c;
    }
  }

  if (quotePending) inQuotes = false;
  if (any && (field !== "" || row.length > 0)) {
    row.push(field);
    yield row;
  }
}

/** Turns rows into objects keyed by the header row. Skips blank lines. */
export async function* csvRecords(
  chunks: AsyncIterable<string> | Iterable<string>,
  opts: CsvOptions = {},
): AsyncGenerator<Record<string, string>> {
  let header: string[] | null = null;
  for await (const row of parseCsv(chunks, opts)) {
    if (row.length === 1 && row[0] === "") continue;
    if (!header) {
      header = row.map((h, i) => (i === 0 ? h.replace(/^﻿/, "") : h).trim());
      continue;
    }
    const rec: Record<string, string> = {};
    for (let i = 0; i < header.length; i++) rec[header[i] as string] = row[i] ?? "";
    yield rec;
  }
}
