'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Check, User } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { PhoneField } from '@/components/PhoneField';

const WEST_AFRICA_COUNTRIES = [
  'Niger', 'Nigeria', 'Bénin', 'Burkina Faso', 'Côte d\'Ivoire', 'Ghana',
  'Guinée', 'Guinée-Bissau', 'Liberia', 'Mali', 'Mauritanie', 'Sénégal',
  'Sierra Leone', 'Togo', 'Cap-Vert', 'Gambie',
];

const OTHER_COUNTRIES = [
  'Algérie', 'Cameroun', 'Canada', 'Centrafrique', 'Comores', 'Congo',
  'Djibouti', 'Égypte', 'Éthiopie', 'France', 'Gabon', 'Kenya',
  'Madagascar', 'Maroc', 'RD Congo', 'Rwanda', 'Tchad', 'Tunisie',
  'Belgique', 'Suisse', 'États-Unis', 'Royaume-Uni', 'Allemagne',
  'Arabie Saoudite', 'Émirats arabes unis', 'Chine', 'Inde', 'Autre',
];

const PROFESSIONS = [
  'Entrepreneur', 'Fonctionnaire', 'Cadre d\'entreprise', 'Commerçant',
  'Agriculteur', 'Enseignant / Chercheur', 'Étudiant', 'Journaliste / Média',
  'Banquier / Finance', 'Ingénieur / Technicien', 'Médecin / Santé',
  'Avocat / Juriste', 'Consultant', 'Artisan', 'Retraité', 'Sans emploi', 'Autre',
];

export default function CompleterProfilPage() {
  const { isSignedIn, isLoading, profile } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // Form state
  const [phone, setPhone] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('Niger');
  const [profession, setProfession] = useState('');

  // Redirect if not signed in or profile already completed
  useEffect(() => {
    if (!isLoading && !isSignedIn) {
      router.push('/connexion');
    }
    if (profile) {
      const p = profile as unknown as Record<string, unknown>;
      if (p.profile_completed === true) {
        router.push('/');
      }
    }
  }, [isLoading, isSignedIn, profile, router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = { profile_completed: true };
      if (phone) body.phone = phone;
      if (birthDay) body.birth_day = parseInt(birthDay);
      if (birthMonth) body.birth_month = parseInt(birthMonth);
      if (birthYear) body.birth_year = parseInt(birthYear);
      if (address.trim()) body.address = address.trim();
      if (city.trim()) body.city = city.trim();
      if (postalCode.trim()) body.postal_code = postalCode.trim();
      if (country) body.country = country;
      if (profession) body.profession = profession;

      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch {} finally {
      setSaving(false);
      router.push('/');
    }
  };

  const handleSkip = async () => {
    // Mark as completed without saving any data
    try {
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_completed: true }),
      });
    } catch {}
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const inputClass = "w-full border border-black/[0.08] rounded-lg px-4 py-3 text-[14px] bg-[#fafaf9] focus:outline-none focus:ring-1 focus:ring-black/10";
  const selectClass = "w-full border border-black/[0.08] rounded-lg px-4 py-3 text-[14px] bg-[#fafaf9]";

  return (
    <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-[0_4px_40px_-12px_rgba(0,0,0,0.08)] p-8 sm:p-10 animate-fade-in-up">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-[#d4a843]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-7 h-7 text-[#d4a843]" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Complétez votre profil</h1>
            <p className="text-gray-500 text-[14px]">
              Ces informations sont optionnelles. Vous pouvez les ajouter maintenant ou plus tard depuis votre compte.
            </p>
          </div>

          <div className="space-y-5">
            {/* Téléphone */}
            <PhoneField value={phone} onChange={setPhone} />

            {/* Date de naissance */}
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Date de naissance</label>
              <div className="grid grid-cols-3 gap-2">
                <select value={birthDay} onChange={(e) => setBirthDay(e.target.value)} className={selectClass}>
                  <option value="">Jour</option>
                  {Array.from({ length: 31 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                </select>
                <select value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)} className={selectClass}>
                  <option value="">Mois</option>
                  {['Jan.','Fév.','Mars','Avr.','Mai','Juin','Juil.','Août','Sep.','Oct.','Nov.','Déc.'].map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                </select>
                <select value={birthYear} onChange={(e) => setBirthYear(e.target.value)} className={selectClass}>
                  <option value="">Année</option>
                  {Array.from({ length: 80 }, (_, i) => new Date().getFullYear() - 13 - i).map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            {/* Adresse */}
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Adresse</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Votre adresse" className={inputClass} />
            </div>

            {/* Ville / Code postal */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Ville</label>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Votre ville" className={inputClass} />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Code postal</label>
                <input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="Code postal" className={inputClass} />
              </div>
            </div>

            {/* Pays */}
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Pays</label>
              <select value={country} onChange={(e) => setCountry(e.target.value)} className={selectClass}>
                <optgroup label="Afrique de l'Ouest">
                  {WEST_AFRICA_COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </optgroup>
                <optgroup label="Autres pays">
                  {OTHER_COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </optgroup>
              </select>
            </div>

            {/* Profession */}
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Profession</label>
              <select value={profession} onChange={(e) => setProfession(e.target.value)} className={selectClass}>
                <option value="">Sélectionner</option>
                {PROFESSIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 space-y-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-[#111] text-white py-3.5 rounded-xl text-[14px] font-medium hover:bg-[#222] transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Enregistrer et continuer
            </button>
            <button
              onClick={handleSkip}
              className="w-full text-center text-[13px] text-gray-400 hover:text-gray-600 transition-colors py-2"
            >
              Passer cette étape
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
