import DOMPurify from "dompurify";

export const sanitizeText = (str: string): string => {
  if (!str) return "";
  if (typeof window === "undefined") {
    // If running server-side, strip HTML tags via regex
    return str.replace(/<[^>]*>/g, "").trim();
  }
  return DOMPurify.sanitize(str, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();
};
