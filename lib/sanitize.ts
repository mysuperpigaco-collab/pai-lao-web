import DOMPurify from "isomorphic-dompurify";

export function sanitizeRichHtml(html: string): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "hr", "h2", "h3", "strong", "em", "u", "s",
      "ul", "ol", "li", "blockquote", "a", "img",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "src", "alt"],
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|\/)/i,
  });
}
