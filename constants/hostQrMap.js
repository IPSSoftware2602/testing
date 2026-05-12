// CR-018: Subdomain → Unique QR code mapping for the Expo web build.
//
// Some clients get their own white-labelled subdomain pointing at this app
// (e.g. `regaliatest.cocacola.my`). When a user lands on the subdomain root,
// the app should auto-route them to that subdomain's pre-configured QR menu
// instead of the generic home screen.
//
// Add entries here as new subdomains come online. Keys are exact hostnames
// (lowercase, no port). Values are unique QR codes that exist in the backend
// `unique_qrs.unique_code` column.
//
// Scaling note: if this list grows past ~30 entries or needs frequent updates,
// move to a backend API (e.g. GET /host-qr-map) and cache the response in
// AsyncStorage with a short TTL. For now hardcoded is cheaper.
//
// IMPORTANT: each non-uspizza root domain (e.g. cocacola.my) must be
// configured separately in CloudFront / hosting + have its own SSL cert.
// This file only handles app-side routing, not the DNS/CDN layer.
const HOST_QR_MAP = {
  'regaliatest.cocacola.my': 'D1C35415',
  // Future entries:
  // 'cozyhome.uspizza.com': '1C6727E5',
  // 'sunway.uspizza.com':   'ABC12345',
};

/**
 * Return the QR code associated with a hostname, or null if there's no mapping.
 * Lookup is case-insensitive and ignores any port suffix.
 */
export function getQrCodeForHost(host) {
  if (!host || typeof host !== 'string') return null;
  const key = host.toLowerCase().split(':')[0];
  return HOST_QR_MAP[key] || null;
}

export default HOST_QR_MAP;
