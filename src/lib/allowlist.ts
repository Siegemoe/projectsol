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

const ALLOWLIST: Set<string> = new Set(
  (process.env.EMAIL_ALLOWLIST || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
);

export function isAllowlisted(email: string | null | undefined): boolean {
  if (ALLOWLIST.size === 0) return true;
  if (!email) return false;

  const lowerEmail = email.toLowerCase();
  if (ALLOWLIST.has(lowerEmail)) return true;

  const domain = lowerEmail.split("@")[1];
  if (domain && (ALLOWLIST.has(`@${domain}`) || ALLOWLIST.has(domain))) {
    return true;
  }

  return false;
}
