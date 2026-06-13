import DOMPurify from "isomorphic-dompurify";

export function sanitizeRichHtml(html: string): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "hr", "h2", "h3", "strong", "em", "u", "s",
      "ul", "ol", "li", "blockquote", "a", "img",
      "pre", "code",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "src", "alt", "style"],
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|\/)/i,
  });
}
