import { createHash } from 'node:crypto';

/**
 * Produces a stable structural fingerprint of an HTML page.
 *
 * The fingerprint captures the page's *template* (tag hierarchy + class names)
 * while stripping all variable text, IDs, hrefs, and style attributes so that
 * the same ATS template always produces the same hash regardless of which jobs
 * are listed or how many there are.
 */
export function fingerprintDOM(html: string): string {
  const structural = html
    // Remove script / style content entirely
    .replace(/<script[\s\S]*?<\/script>/gi, '<script/>')
    .replace(/<style[\s\S]*?<\/style>/gi, '<style/>')
    // Strip attribute values that vary per-request (href, src, id, data-*)
    .replace(/\s(href|src|id|data-[^=]*)="[^"]*"/gi, '')
    // Strip inline styles
    .replace(/\sstyle="[^"]*"/gi, '')
    // Collapse whitespace inside tags so minor formatting diffs don't change hash
    .replace(/\s+/g, ' ')
    // Remove all text nodes (everything between > and <)
    .replace(/>([^<]*)</g, '><')
    .trim();

  return createHash('sha256').update(structural).digest('hex').slice(0, 32);
}

/**
 * Extracts the normalized domain from a URL string.
 * "https://www.acme.com/careers" → "acme.com"
 */
export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/**
 * Hashes arbitrary text for use as a cache key.
 * Used for embedding cache and prompt cache lookups.
 */
export function hashContent(text: string): string {
  return createHash('sha256')
    .update(text.trim().toLowerCase())
    .digest('hex');
}
