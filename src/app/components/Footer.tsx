import { Link } from 'react-router';
import { Facebook, Twitter, Linkedin, Instagram, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#111] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          <div>
            <h3 className="text-[20px] mb-4">NFI Report</h3>
            <p className="text-white/40 text-[13px] leading-relaxed">
              Votre source d'informations économiques et financières pour le Niger et l'Afrique de l'Ouest.
            </p>
          </div>

          <div>
            <h4 className="text-[11px] tracking-[0.15em] uppercase text-white/30 mb-5">Rubriques</h4>
            <ul className="space-y-2.5 text-[13px]">
              <li>
                <Link to="/economie" className="text-white/45 hover:text-white/80 transition-colors">
                  Économie
                </Link>
              </li>
              <li>
                <Link to="/finance" className="text-white/45 hover:text-white/80 transition-colors">
                  Finance
                </Link>
              </li>
              <li>
                <Link to="/marches" className="text-white/45 hover:text-white/80 transition-colors">
                  Marchés
                </Link>
              </li>
              <li>
                <Link to="/entreprises" className="text-white/45 hover:text-white/80 transition-colors">
                  Entreprises
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] tracking-[0.15em] uppercase text-white/30 mb-5">Société</h4>
            <ul className="space-y-2.5 text-[13px]">
              <li>
                <Link to="/about" className="text-white/45 hover:text-white/80 transition-colors">
                  Qui sommes-nous
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-white/45 hover:text-white/80 transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/publicite" className="text-white/45 hover:text-white/80 transition-colors">
                  Publicité
                </Link>
              </li>
              <li>
                <Link to="/mentions-legales" className="text-white/45 hover:text-white/80 transition-colors">
                  Mentions légales
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] tracking-[0.15em] uppercase text-white/30 mb-5">Suivez-nous</h4>
            <div className="flex gap-3 mb-5">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-white/[0.06] rounded-full flex items-center justify-center hover:bg-white/[0.12] transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-white/[0.06] rounded-full flex items-center justify-center hover:bg-white/[0.12] transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-white/[0.06] rounded-full flex items-center justify-center hover:bg-white/[0.12] transition-colors"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-white/[0.06] rounded-full flex items-center justify-center hover:bg-white/[0.12] transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
            <a
              href="mailto:contact@nfireport.ne"
              className="text-white/40 hover:text-white/70 transition-colors text-[13px] flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              contact@nfireport.ne
            </a>
          </div>
        </div>

        <div className="border-t border-white/[0.06] pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[12px] text-white/25">
            <p>© 2026 NFI Report. Tous droits réservés.</p>
            <div className="flex gap-6">
              <Link to="/confidentialite" className="hover:text-white/50 transition-colors">
                Confidentialité
              </Link>
              <Link to="/cookies" className="hover:text-white/50 transition-colors">
                Cookies
              </Link>
              <Link to="/cgu" className="hover:text-white/50 transition-colors">
                CGU
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}