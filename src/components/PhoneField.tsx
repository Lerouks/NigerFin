'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Country codes ───────────────────────────────────────────────────────────

interface CountryCode {
  flag: string;
  name: string;
  code: string;
  digits: number;
  placeholder: string;
}

const WEST_AFRICA: CountryCode[] = [
  { flag: '🇳🇪', name: 'Niger', code: '+227', digits: 8, placeholder: '90 00 00 00' },
  { flag: '🇧🇫', name: 'Burkina Faso', code: '+226', digits: 8, placeholder: '70 00 00 00' },
  { flag: '🇲🇱', name: 'Mali', code: '+223', digits: 8, placeholder: '70 00 00 00' },
  { flag: '🇸🇳', name: 'Sénégal', code: '+221', digits: 9, placeholder: '77 000 00 00' },
  { flag: '🇨🇮', name: 'Côte d\'Ivoire', code: '+225', digits: 10, placeholder: '07 00 00 00 00' },
  { flag: '🇬🇭', name: 'Ghana', code: '+233', digits: 9, placeholder: '24 000 0000' },
  { flag: '🇬🇳', name: 'Guinée', code: '+224', digits: 9, placeholder: '620 00 00 00' },
  { flag: '🇧🇯', name: 'Bénin', code: '+229', digits: 8, placeholder: '90 00 00 00' },
  { flag: '🇹🇬', name: 'Togo', code: '+228', digits: 8, placeholder: '90 00 00 00' },
  { flag: '🇲🇷', name: 'Mauritanie', code: '+222', digits: 8, placeholder: '30 00 00 00' },
  { flag: '🇸🇱', name: 'Sierra Leone', code: '+232', digits: 8, placeholder: '76 00 00 00' },
  { flag: '🇱🇷', name: 'Liberia', code: '+231', digits: 8, placeholder: '77 00 00 00' },
  { flag: '🇬🇲', name: 'Gambie', code: '+220', digits: 7, placeholder: '300 0000' },
  { flag: '🇬🇼', name: 'Guinée-Bissau', code: '+245', digits: 7, placeholder: '955 0000' },
  { flag: '🇨🇻', name: 'Cap-Vert', code: '+238', digits: 7, placeholder: '991 0000' },
];

const OTHER_COUNTRIES: CountryCode[] = [
  { flag: '🇳🇬', name: 'Nigeria', code: '+234', digits: 10, placeholder: '801 000 0000' },
  { flag: '🇨🇲', name: 'Cameroun', code: '+237', digits: 9, placeholder: '6 70 00 00 00' },
  { flag: '🇹🇩', name: 'Tchad', code: '+235', digits: 8, placeholder: '66 00 00 00' },
  { flag: '🇩🇿', name: 'Algérie', code: '+213', digits: 9, placeholder: '5 50 00 00 00' },
  { flag: '🇲🇦', name: 'Maroc', code: '+212', digits: 9, placeholder: '6 00 00 00 00' },
  { flag: '🇹🇳', name: 'Tunisie', code: '+216', digits: 8, placeholder: '20 00 00 00' },
  { flag: '🇪🇬', name: 'Égypte', code: '+20', digits: 10, placeholder: '100 000 0000' },
  { flag: '🇫🇷', name: 'France', code: '+33', digits: 9, placeholder: '6 00 00 00 00' },
  { flag: '🇧🇪', name: 'Belgique', code: '+32', digits: 9, placeholder: '470 00 00 00' },
  { flag: '🇨🇭', name: 'Suisse', code: '+41', digits: 9, placeholder: '76 000 00 00' },
  { flag: '🇺🇸', name: 'États-Unis', code: '+1', digits: 10, placeholder: '201 555 0000' },
  { flag: '🇬🇧', name: 'Royaume-Uni', code: '+44', digits: 10, placeholder: '7911 123456' },
  { flag: '🇩🇪', name: 'Allemagne', code: '+49', digits: 11, placeholder: '151 1234 5678' },
  { flag: '🇸🇦', name: 'Arabie Saoudite', code: '+966', digits: 9, placeholder: '50 000 0000' },
  { flag: '🇦🇪', name: 'Émirats', code: '+971', digits: 9, placeholder: '50 000 0000' },
  { flag: '🇨🇳', name: 'Chine', code: '+86', digits: 11, placeholder: '131 0000 0000' },
  { flag: '🇮🇳', name: 'Inde', code: '+91', digits: 10, placeholder: '98765 43210' },
];

const ALL_COUNTRIES = [...WEST_AFRICA, ...OTHER_COUNTRIES];

function findCountryByCode(code: string): CountryCode {
  return ALL_COUNTRIES.find((c) => c.code === code) || WEST_AFRICA[0]!;
}

// ─── Formatting ──────────────────────────────────────────────────────────────

function formatNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  // Format in groups of 2
  return digits.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
}

// ─── Component ───────────────────────────────────────────────────────────────

interface PhoneFieldProps {
  /** Full phone number with country code, e.g. "+22790000000" */
  value: string;
  onChange: (fullPhone: string) => void;
  disabled?: boolean;
}

export function PhoneField({ value, onChange, disabled }: PhoneFieldProps) {
  // Parse initial value into country code + number
  const [countryCode, setCountryCode] = useState('+227');
  const [number, setNumber] = useState('');

  // Parse value on mount and when value changes externally
  useEffect(() => {
    if (!value) {
      setCountryCode('+227');
      setNumber('');
      return;
    }

    // Find matching country code (longest match first)
    const sorted = [...ALL_COUNTRIES].sort((a, b) => b.code.length - a.code.length);
    const match = sorted.find((c) => value.startsWith(c.code));
    if (match) {
      setCountryCode(match.code);
      setNumber(value.slice(match.code.length));
    } else {
      // Fallback: assume it's just digits
      setNumber(value.replace(/\D/g, ''));
    }
  }, [value]);

  const country = findCountryByCode(countryCode);

  const handleCountryChange = useCallback((newCode: string) => {
    setCountryCode(newCode);
    // Re-emit with new code
    if (number) {
      onChange(`${newCode}${number}`);
    } else {
      onChange('');
    }
  }, [number, onChange]);

  const handleNumberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, country.digits);
    setNumber(raw);
    if (raw) {
      onChange(`${countryCode}${raw}`);
    } else {
      onChange('');
    }
  }, [countryCode, country.digits, onChange]);

  return (
    <div>
      <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Téléphone</label>
      <div className="flex gap-2">
        {/* Country code selector */}
        <select
          value={countryCode}
          onChange={(e) => handleCountryChange(e.target.value)}
          disabled={disabled}
          className="border border-black/8 rounded-lg px-2 py-3 text-[13px] bg-background disabled:text-gray-500 min-w-0 w-[120px] sm:w-[140px] shrink-0"
        >
          <optgroup label="Afrique de l'Ouest">
            {WEST_AFRICA.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.code}
              </option>
            ))}
          </optgroup>
          <optgroup label="Autres pays">
            {OTHER_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.code}
              </option>
            ))}
          </optgroup>
        </select>

        {/* Number input */}
        <input
          type="tel"
          inputMode="numeric"
          value={formatNumber(number)}
          onChange={handleNumberChange}
          disabled={disabled}
          maxLength={country.digits + Math.floor(country.digits / 2)}
          placeholder={country.placeholder}
          className="flex-1 border border-black/8 rounded-lg px-4 py-3 text-[14px] bg-background focus:outline-hidden focus:ring-1 focus:ring-black/10 disabled:text-gray-500 min-w-0"
        />
      </div>
    </div>
  );
}

/** Validate a full phone number (code + digits). Returns error message or null. */
export function validatePhone(fullPhone: string): string | null {
  if (!fullPhone) return null; // Optional field

  const sorted = [...ALL_COUNTRIES].sort((a, b) => b.code.length - a.code.length);
  const match = sorted.find((c) => fullPhone.startsWith(c.code));

  if (!match) {
    // Unknown code, just check basic length
    const digits = fullPhone.replace(/\D/g, '');
    if (digits.length < 8 || digits.length > 15) return 'Numéro de téléphone invalide.';
    return null;
  }

  const numberPart = fullPhone.slice(match.code.length);
  if (numberPart.length !== match.digits) {
    return `Le numéro ${match.name} doit contenir ${match.digits} chiffres.`;
  }

  if (!/^\d+$/.test(numberPart)) {
    return 'Le numéro ne doit contenir que des chiffres.';
  }

  return null;
}
