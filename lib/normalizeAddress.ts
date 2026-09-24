/**
 * Single authority for what counts as "the same address."
 * Lowercase → trim → strip leading http(s):// → strip trailing slash.
 */
export function normalizeAddress(raw: string): string {
  let address = raw.toLowerCase().trim();
  address = address.replace(/^https?:\/\//, "");
  address = address.replace(/\/+$/, "");
  return address;
}
