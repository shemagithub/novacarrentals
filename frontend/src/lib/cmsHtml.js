/** True when CMS HTML has no visible text (empty paragraphs / breaks only). */
export function isCmsHtmlContentEmpty(html) {
  if (html == null) return true;
  const text = String(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length === 0;
}

/**
 * Remove `?auth=` / `?token=` query params from `/api/files/...` URLs inside HTML
 * so editor previews are not persisted with bearer tokens.
 */
export function stripAuthQueryFromFileUrlsInHtml(html) {
  if (html == null || typeof html !== "string") return html;
  return html.replace(
    /(\/api\/files\/[^"'>\s?]+)\?(?:auth|token)=[^"'>\s]*/gi,
    "$1",
  );
}
