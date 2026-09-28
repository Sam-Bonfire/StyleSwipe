/**
 * Affiliate redirect rule (catalog/affiliate context).
 * Pure URL matching + tracking-param application. The backend supplies
 * stored rules; this function decides and builds the outbound URL.
 * No URL constructor: Convex-safe and try/catch-free by construction.
 */

export interface AffiliateRuleInput {
  merchantDomain: string;
  isEnabled: boolean;
  trackingParams: { key: string; value: string }[];
}

function extractHostname(rawUrl: string): string | null {
  const match = /^[a-z][a-z0-9+.-]*:\/\/([^/?#]+)/i.exec(rawUrl);
  if (!match) return null;
  const authority = match[1];
  const hostPort = authority.includes('@') ? authority.slice(authority.lastIndexOf('@') + 1) : authority;
  return hostPort.replace(/:\d+$/, '').toLowerCase();
}

function setQueryParam(query: string, key: string, value: string): string {
  const encoded = `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
  const prefix = `${encodeURIComponent(key)}=`;
  const parts = query ? query.split('&') : [];
  const index = parts.findIndex((part) => part === prefix || part.startsWith(prefix));
  if (index >= 0) {
    parts[index] = encoded;
  } else {
    parts.push(encoded);
  }
  return parts.join('&');
}

/**
 * Applies the matching enabled affiliate rule (if any) by appending
 * its tracking params to the retailer URL. No rule (or disabled) → raw URL.
 */
export function applyAffiliateRule(rawUrl: string, rules: AffiliateRuleInput[]): string {
  const hostname = extractHostname(rawUrl);
  if (!hostname) return rawUrl;
  const rule = rules.find(
    (r) => r.isEnabled && (hostname === r.merchantDomain || hostname.endsWith(`.${r.merchantDomain}`)),
  );
  if (!rule || rule.trackingParams.length === 0) return rawUrl;

  const hashIndex = rawUrl.indexOf('#');
  const hash = hashIndex >= 0 ? rawUrl.slice(hashIndex) : '';
  const withoutHash = hashIndex >= 0 ? rawUrl.slice(0, hashIndex) : rawUrl;
  const queryIndex = withoutHash.indexOf('?');
  const base = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;
  let query = queryIndex >= 0 ? withoutHash.slice(queryIndex + 1) : '';
  for (const { key, value } of rule.trackingParams) {
    if (key) query = setQueryParam(query, key, value);
  }
  return query ? `${base}?${query}${hash}` : `${base}${hash}`;
}
