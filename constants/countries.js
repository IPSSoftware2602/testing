// CR-003: Centralized country dialing-code list for the country code picker.
// Order = display order (Southeast Asia first, then East Asia, South Asia, Middle East,
// Europe, Americas, Oceania, Africa, etc).
// Each entry: { name, code, dial }. `dial` includes the leading "+".

export const COUNTRIES = [
  // Southeast Asia
  { name: 'Malaysia', code: 'MY', dial: '+60' },
  { name: 'Singapore', code: 'SG', dial: '+65' },
  { name: 'Indonesia', code: 'ID', dial: '+62' },
  { name: 'Thailand', code: 'TH', dial: '+66' },
  { name: 'Vietnam', code: 'VN', dial: '+84' },
  { name: 'Philippines', code: 'PH', dial: '+63' },
  { name: 'Brunei', code: 'BN', dial: '+673' },

  // East Asia
  { name: 'China', code: 'CN', dial: '+86' },
  { name: 'Hong Kong', code: 'HK', dial: '+852' },
  { name: 'Macau', code: 'MO', dial: '+853' },
  { name: 'Taiwan', code: 'TW', dial: '+886' },
  { name: 'Japan', code: 'JP', dial: '+81' },
  { name: 'South Korea', code: 'KR', dial: '+82' },

  // South Asia
  { name: 'India', code: 'IN', dial: '+91' },
  { name: 'Sri Lanka', code: 'LK', dial: '+94' },
  { name: 'Nepal', code: 'NP', dial: '+977' },

  // Middle East
  { name: 'United Arab Emirates', code: 'AE', dial: '+971' },
  { name: 'Saudi Arabia', code: 'SA', dial: '+966' },
  { name: 'Qatar', code: 'QA', dial: '+974' },
  { name: 'Kuwait', code: 'KW', dial: '+965' },
  { name: 'Oman', code: 'OM', dial: '+968' },
  { name: 'Bahrain', code: 'BH', dial: '+973' },

  // Europe
  { name: 'United Kingdom', code: 'GB', dial: '+44' },
  { name: 'Ireland', code: 'IE', dial: '+353' },
  { name: 'France', code: 'FR', dial: '+33' },
  { name: 'Germany', code: 'DE', dial: '+49' },
  { name: 'Italy', code: 'IT', dial: '+39' },
  { name: 'Spain', code: 'ES', dial: '+34' },
  { name: 'Netherlands', code: 'NL', dial: '+31' },
  { name: 'Belgium', code: 'BE', dial: '+32' },
  { name: 'Switzerland', code: 'CH', dial: '+41' },
  { name: 'Austria', code: 'AT', dial: '+43' },
  { name: 'Sweden', code: 'SE', dial: '+46' },
  { name: 'Norway', code: 'NO', dial: '+47' },
  { name: 'Denmark', code: 'DK', dial: '+45' },
  { name: 'Finland', code: 'FI', dial: '+358' },
  { name: 'Poland', code: 'PL', dial: '+48' },
  { name: 'Czech Republic', code: 'CZ', dial: '+420' },
  { name: 'Hungary', code: 'HU', dial: '+36' },
  { name: 'Portugal', code: 'PT', dial: '+351' },
  { name: 'Greece', code: 'GR', dial: '+30' },
  { name: 'Turkey', code: 'TR', dial: '+90' },
  { name: 'Russia', code: 'RU', dial: '+7' },
  { name: 'Ukraine', code: 'UA', dial: '+380' },

  // Americas
  { name: 'United States', code: 'US', dial: '+1' },
  { name: 'Canada', code: 'CA', dial: '+1' },
  { name: 'Mexico', code: 'MX', dial: '+52' },
  { name: 'Brazil', code: 'BR', dial: '+55' },
  { name: 'Argentina', code: 'AR', dial: '+54' },
  { name: 'Chile', code: 'CL', dial: '+56' },
  { name: 'Colombia', code: 'CO', dial: '+57' },
  { name: 'Peru', code: 'PE', dial: '+51' },

  // Oceania
  { name: 'Australia', code: 'AU', dial: '+61' },
  { name: 'New Zealand', code: 'NZ', dial: '+64' },

  // Africa
  { name: 'South Africa', code: 'ZA', dial: '+27' },
  { name: 'Egypt', code: 'EG', dial: '+20' },
  { name: 'Nigeria', code: 'NG', dial: '+234' },
  { name: 'Kenya', code: 'KE', dial: '+254' },
  { name: 'Morocco', code: 'MA', dial: '+212' },

  // Other Middle East
  { name: 'Iran', code: 'IR', dial: '+98' },
  { name: 'Jordan', code: 'JO', dial: '+962' },
];

export const DEFAULT_COUNTRY = COUNTRIES[0]; // Malaysia

// Quick lookup helpers used by the picker and address screens.
export function findCountryByDial(dial) {
  if (!dial) return null;
  return COUNTRIES.find(c => c.dial === dial) || null;
}

// Split a stored phone string back into { dial, local } for re-populating
// the picker + phone field on edit screens.
//
// Handles three formats encountered in the wild:
//   "+60123456789"  — E.164 with leading "+" (login OTP payload, older app records)
//   "60123456789"   — bare digits, country code prefixed (CR-003 v2 address records)
//   "0123456789"    — bare local number, no country code (legacy address records pre-picker)
//
// Match the longest dial code first so "+852" beats "+8" etc. For bare-digit
// inputs we additionally require that the remainder doesn't start with "0" —
// a leading zero strongly implies "this is a local number, not international"
// (e.g. Malaysia mobile "0123456789" must NOT split as country "+1" + "23456789").
export function splitInternationalPhone(rawPhone) {
  const fallback = { dial: DEFAULT_COUNTRY.dial, local: rawPhone || '' };
  if (!rawPhone || typeof rawPhone !== 'string') return fallback;

  const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);

  if (rawPhone.startsWith('+')) {
    for (const c of sorted) {
      if (rawPhone.startsWith(c.dial)) {
        return { dial: c.dial, local: rawPhone.slice(c.dial.length) };
      }
    }
    return fallback;
  }

  // Bare-digit format: try matching dial without the "+". Skip when the next
  // char would be "0" (looks like a local-format number with leading zero).
  for (const c of sorted) {
    const bare = c.dial.slice(1); // "+60" -> "60"
    if (rawPhone.startsWith(bare)) {
      const remainder = rawPhone.slice(bare.length);
      if (remainder.startsWith('0')) continue;
      if (remainder === '') continue;
      return { dial: c.dial, local: remainder };
    }
  }
  return fallback;
}

// Strip the leading "+" from a dial code for the {countrycode}{phonenum}
// address payload format (e.g. "+60" + "123456789" -> "60123456789").
export function dialDigits(dial) {
  if (!dial || typeof dial !== 'string') return '';
  return dial.startsWith('+') ? dial.slice(1) : dial;
}
