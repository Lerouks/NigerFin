'use client';

import { useEffect, useId, useState } from 'react';
import type { CountryCode } from 'libphonenumber-js';
import { AUTRES_PAYS, PAYS_AFRIQUE_OUEST } from '@/lib/pays';
import {
  decomposerTelephone,
  erreurTelephone,
  estPaysDuTelephone,
  indicatif,
  saisieLisible,
} from '@/lib/telephone';

/**
 * Le téléphone, facultatif : l'indicatif du pays, puis le numéro, regroupé
 * comme on l'écrit dans ce pays. La valeur rendue est le numéro international
 * (« +22790123456 »), ou une chaîne vide. La longueur de chaque pays vient de
 * la bibliothèque de Google (src/lib/telephone.ts), plus d'une liste écrite à
 * la main.
 */

/** Le drapeau d'un pays, à partir de son code ISO. */
function drapeau(iso: string): string {
  return String.fromCodePoint(...[...iso.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

interface PhoneFieldProps {
  /** Le numéro international, par exemple « +22790123456 », ou une chaîne vide. */
  value: string;
  onChange: (numero: string) => void;
  disabled?: boolean;
  /** Texte d'aide sous le champ. */
  aide?: string;
}

export function PhoneField({ value, onChange, disabled, aide }: PhoneFieldProps) {
  const idNumero = useId();
  const idAide = useId();
  const [pays, setPays] = useState<CountryCode>(() => decomposerTelephone(value).pays);
  const [chiffres, setChiffres] = useState(() => decomposerTelephone(value).national);

  // Une valeur changée de l'extérieur (annulation, enregistrement) se relit.
  useEffect(() => {
    const actuel = chiffres ? `${indicatif(pays)}${chiffres}` : '';
    if (value === actuel) return;
    const lu = decomposerTelephone(value);
    setPays(lu.pays);
    setChiffres(lu.national);
    // On ne relit que si la valeur vient d'ailleurs que de ce champ.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function emettre(nouveauPays: CountryCode, nouveauxChiffres: string) {
    onChange(nouveauxChiffres ? `${indicatif(nouveauPays)}${nouveauxChiffres}` : '');
  }

  function changerPays(iso: string) {
    if (!estPaysDuTelephone(iso)) return;
    setPays(iso);
    emettre(iso, chiffres);
  }

  function changerNumero(saisie: string) {
    // Un numéro collé avec son indicatif (« +227 90… » ou « 00227 90… ») : on
    // garde la partie nationale si l'indicatif est celui du pays choisi.
    let net = saisie.replace(/[^\d+]/g, '');
    const prefixe = indicatif(pays).slice(1);
    if (net.startsWith('+')) net = net.slice(1);
    else if (net.startsWith('00')) net = net.slice(2);
    else net = net.replace(/\+/g, '');
    if (saisie.trim().startsWith('+') || saisie.trim().startsWith('00')) {
      if (net.startsWith(prefixe)) net = net.slice(prefixe.length);
    }
    const nouveaux = net.replace(/\D/g, '').slice(0, 15);
    setChiffres(nouveaux);
    emettre(pays, nouveaux);
  }

  return (
    <div>
      <label htmlFor={idNumero} className="block text-[13px] font-medium text-gray-700 mb-1.5">Téléphone</label>
      <div className="flex gap-2">
        <select
          value={pays}
          onChange={(e) => changerPays(e.target.value)}
          aria-label="Indicatif du pays"
          disabled={disabled}
          className="border border-black/8 rounded-lg px-2 py-3 text-[13px] bg-background disabled:text-gray-500 min-w-0 w-[120px] sm:w-[140px] shrink-0"
        >
          <optgroup label="Afrique de l’Ouest">
            {PAYS_AFRIQUE_OUEST.map((p) => (
              <option key={p.iso} value={p.iso} aria-label={`${p.nom}, ${indicatif(p.iso as CountryCode)}`}>
                {drapeau(p.iso)} {indicatif(p.iso as CountryCode)}
              </option>
            ))}
          </optgroup>
          <optgroup label="Autres pays">
            {AUTRES_PAYS.map((p) => (
              <option key={p.iso} value={p.iso} aria-label={`${p.nom}, ${indicatif(p.iso as CountryCode)}`}>
                {drapeau(p.iso)} {indicatif(p.iso as CountryCode)}
              </option>
            ))}
          </optgroup>
        </select>

        <input
          id={idNumero}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={saisieLisible(chiffres, pays)}
          onChange={(e) => changerNumero(e.target.value)}
          disabled={disabled}
          aria-describedby={aide ? idAide : undefined}
          className="flex-1 border border-black/8 rounded-lg px-4 py-3 text-[14px] bg-background focus:outline-hidden focus:ring-1 focus:ring-black/10 disabled:text-gray-500 min-w-0"
        />
      </div>
      {aide && <p id={idAide} className="mt-1.5 text-[13px] leading-[1.45] text-[#5f636b]">{aide}</p>}
    </div>
  );
}

/** La phrase d'erreur d'un numéro, ou null s'il est vide ou valable. */
export function validatePhone(numero: string): string | null {
  return erreurTelephone(numero);
}
