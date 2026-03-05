'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Facebook, Twitter, Linkedin, Instagram, Mail, Youtube } from 'lucide-react';

interface SocialLinks {
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13.2a8.16 8.16 0 005.58 2.18v-3.44a4.85 4.85 0 01-1-.1 4.83 4.83 0 01-3.58-2.72V2.44h3.45a4.83 4.83 0 003.77 4.25v3.44a8.16 8.16 0 01-2.64-.44z" />
    </svg>
  );
}

export function Footer() {
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({});
  const [contactEmail, setContactEmail] = useState('contact@nfireport.ne');

  useEffect(() => {
    fetch('/api/site-settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.socialLinks) setSocialLinks(data.socialLinks);
        if (data.contactEmail) setContactEmail(data.contactEmail);
      })
      .catch(() => {});
  }, []);

  const socialItems = [
    { icon: Facebook, label: 'Facebook', url: socialLinks.facebook },
    { icon: Twitter, label: 'Twitter', url: socialLinks.twitter },
    { icon: Linkedin, label: 'LinkedIn', url: socialLinks.linkedin },
    { icon: Instagram, label: 'Instagram', url: socialLinks.instagram },
    { icon: Youtube, label: 'YouTube', url: socialLinks.youtube },
    { icon: TikTokIcon, label: 'TikTok', url: socialLinks.tiktok },
  ].filter((item) => item.url);

  return (
    <footer className="bg-[#111] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          <div>
            <h3 className="text-[20px] mb-1 font-semibold uppercase tracking-wide">NFI REPORT</h3>
            <p className="text-white/50 text-[13px] mb-4">Niger Financial Insights</p>
            <p className="text-white/40 text-[13px] leading-relaxed">
              Votre source d&apos;informations économiques et financières pour le Niger et
              l&apos;Afrique de l&apos;Ouest.
            </p>
          </div>

          <div>
            <h4 className="text-[11px] tracking-[0.15em] uppercase text-white/30 mb-5">
              Rubriques
            </h4>
            <ul className="space-y-2.5 text-[13px]">
              <li>
                <Link href="/economie" className="text-white/45 hover:text-white/80 transition-colors">
                  Économie
                </Link>
              </li>
              <li>
                <Link href="/finance" className="text-white/45 hover:text-white/80 transition-colors">
                  Finance
                </Link>
              </li>
              <li>
                <Link href="/marches" className="text-white/45 hover:text-white/80 transition-colors">
                  Marchés
                </Link>
              </li>
              <li>
                <Link href="/entreprises" className="text-white/45 hover:text-white/80 transition-colors">
                  Entreprises
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] tracking-[0.15em] uppercase text-white/30 mb-5">
              Société
            </h4>
            <ul className="space-y-2.5 text-[13px]">
              <li>
                <Link href="/about" className="text-white/45 hover:text-white/80 transition-colors">
                  Qui sommes-nous
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-white/45 hover:text-white/80 transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/publicite" className="text-white/45 hover:text-white/80 transition-colors">
                  Publicité
                </Link>
              </li>
              <li>
                <Link href="/mentions-legales" className="text-white/45 hover:text-white/80 transition-colors">
                  Mentions légales
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] tracking-[0.15em] uppercase text-white/30 mb-5">
              Suivez-nous
            </h4>
            <div className="flex gap-3 mb-5">
              {socialItems.length > 0 ? (
                socialItems.map(({ icon: Icon, label, url }) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 bg-white/[0.06] rounded-full flex items-center justify-center hover:bg-white/[0.12] transition-colors"
                    aria-label={label}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))
              ) : (
                [Facebook, Twitter, Linkedin, Instagram].map((Icon, i) => (
                  <span
                    key={i}
                    className="w-9 h-9 bg-white/[0.06] rounded-full flex items-center justify-center hover:bg-white/[0.12] transition-colors cursor-pointer"
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                ))
              )}
            </div>
            <a
              href={`mailto:${contactEmail}`}
              className="text-white/40 hover:text-white/70 transition-colors text-[13px] flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              {contactEmail}
            </a>
          </div>
        </div>

        <div className="border-t border-white/[0.06] pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[12px] text-white/25">
            <p>&copy; {new Date().getFullYear()} NFI Report. Tous droits réservés.</p>
            <div className="flex gap-6">
              <Link href="/confidentialite" className="hover:text-white/50 transition-colors">
                Confidentialité
              </Link>
              <Link href="/cookies" className="hover:text-white/50 transition-colors">
                Cookies
              </Link>
              <Link href="/cgu" className="hover:text-white/50 transition-colors">
                CGU
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
