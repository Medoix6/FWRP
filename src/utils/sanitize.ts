import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitizes a string by stripping all HTML tags and attributes.
 * Uses isomorphic-dompurify which works on both client (native DOM)
 * and server (jsdom under the hood) — no weak regex fallback.
 */
export const sanitizeText = (str: string): string => {
  if (!str) return "";
  return DOMPurify.sanitize(str, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();
};

// Alias for backwards compatibility with imports that use the Sync name
export const sanitizeTextSync = sanitizeText;
