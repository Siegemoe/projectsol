/**
 * Alpha allowlist utility.
 *
 * EMAIL_ALLOWLIST is a comma-separated list of emails and/or domains.
 * Examples:
 *   EMAIL_ALLOWLIST="user1@example.com, user2@example.com, @yourcompany.com, example.org"
 *
 * Matching rules:
 * - Exact email match (case-insensitive) when token contains "@" and does not start with "@".
 * - Domain match when token starts with "@" or contains only a domain (e.g., "example.org"):
 *   a user with email "alice@example.org" matches token "@example.org" or "example.org".
 *
 * If EMAIL_ALLOWLIST is empty or not set, allowlist check passes (returns true) by default.
 */

function parseList(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowlisted(email: string | null | undefined): boolean {
  const items = parseList(process.env.EMAIL_ALLOWLIST);
  // When not configured, do not block
  if (items.length === 0) return true;

  if (!email) return false;
  const e = String(email).toLowerCase();

  for (const token of items) {
    // Exact email match (contains '@' and not a leading domain token)
    if (token.includes("@") && !token.startsWith("@")) {
      if (e === token) return true;
      continue;
    }

    // Domain token (either "@domain" or "domain")
    const domain = token.startsWith("@") ? token.slice(1) : token;
    if (domain && e.endsWith("@" + domain)) {
      return true;
    }
  }
  return false;
}
