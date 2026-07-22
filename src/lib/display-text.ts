/** Normalize user-visible copy: strip em/en dashes and word hyphens. */
export function cleanDisplayText(text: string | null | undefined): string {
  if (text == null) return "";
  const s = String(text).trim();
  if (!s || s === "—" || s === "–" || s === "-") return "";
  return s
    .replace(/[\u2014\u2013]/g, " ")
    .replace(/\s-\s/g, " ")
    .replace(/(\w)-(\w)/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}
