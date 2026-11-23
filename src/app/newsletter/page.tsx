import type { Metadata } from 'next';
import { Mail, FileText, Lock, Sparkles } from 'lucide-react';
import { CategoryHero } from '@/components/CategoryHero';
import { NewsletterForm } from '@/components/NewsletterForm';

export const revalidate = 3600;

// Règle éditoriale du 22/11/2026 : aucune promesse au nom de NFI (jour et
// heure d'envoi, longueur, nombre de mots, lieu d'hébergement, conformité).
// La newsletter n'est pas encore lancée : la page reste générale.
export const metadata: Metadata = {
  title: 'Newsletter',
  description:
    'Recevez par e-mail les analyses de NFI Report sur l’économie du Niger et de l’Afrique de l’Ouest.',
  alternates: { canonical: '/newsletter' },
  openGraph: {
    title: 'Newsletter NFI REPORT',
    description:
      'Les analyses de NFI Report sur l’économie du Niger et de l’Afrique de l’Ouest, par e-mail.',
    type: 'website',
    images: ['/og-image.png'],
  },
};

interface ValueProp {
  icon: typeof Mail;
  title: string;
  body: string;
}

const VALUE_PROPS: ValueProp[] = [
  {
    icon: FileText,
    title: 'Des analyses',
    body: 'Les sujets qui comptent pour l’économie du Niger, expliqués simplement.',
  },
  {
    icon: Sparkles,
    title: 'Le Niger en premier',
    body: 'Économie, finances publiques, bourse et entreprises : le Niger d’abord, puis la sous-région.',
  },
  {
    icon: Mail,
    title: 'Gratuite',
    body: 'L’inscription est gratuite, et vous pouvez vous désinscrire à tout moment.',
  },
];

export default function NewsletterPage() {
  return (
    <div className="min-h-screen bg-background">
      <CategoryHero
        title="La connaissance, votre meilleur capital."
        description="Les analyses de NFI Report sur l’économie du Niger et de l’Afrique de l’Ouest, directement dans votre boîte mail."
      />

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <NewsletterForm />
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="flex items-center gap-2.5 mb-3">
          <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-gold">
            Ce que vous recevez
          </span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-[#111] mb-10">
          L’économie du Niger, dans votre boîte mail.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {VALUE_PROPS.map((prop) => {
            const Icon = prop.icon;
            return (
              <article
                key={prop.title}
                className="bg-white rounded-xl border border-black/6 p-6 shadow-[0_4px_40px_-12px_rgba(0,0,0,0.06)]"
              >
                <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-[#111]" />
                </div>
                <h3 className="text-[16px] font-semibold text-[#111] mb-2">{prop.title}</h3>
                <p className="text-[14px] text-gray-600 leading-relaxed">{prop.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-t border-black/6 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <div className="prose prose-sm sm:prose-base max-w-none">
            <h2 className="text-xl sm:text-2xl font-bold text-[#111] mt-0 mb-3">
              Pourquoi une newsletter dédiée au Niger et à l’Afrique de l’Ouest ?
            </h2>
            <p className="text-[15px] leading-relaxed text-gray-700 mb-10">
              L’information économique et financière sur le Niger est rare et dispersée. La newsletter de NFI
              Report rassemble l’essentiel pour comprendre l’économie du pays et de la sous-région.
            </p>

            <h2 className="text-xl sm:text-2xl font-bold text-[#111] mt-10 mb-3">
              À qui s’adresse cette newsletter ?
            </h2>
            <p className="text-[15px] leading-relaxed text-gray-700 mb-10">
              À tous ceux qui veulent suivre l’économie du Niger : professionnels, entrepreneurs, investisseurs,
              étudiants et membres de la diaspora.
            </p>

            <h2 className="text-xl sm:text-2xl font-bold text-[#111] mt-10 mb-4">
              Vos données, votre contrôle.
            </h2>
            <ul className="space-y-2.5 text-[15px] text-gray-700 list-none pl-0">
              <li className="flex items-start gap-3">
                <Lock className="w-4 h-4 text-gold mt-1 shrink-0" />
                <span className="leading-relaxed">Vous pouvez vous désinscrire à tout moment.</span>
              </li>
              <li className="flex items-start gap-3">
                <Lock className="w-4 h-4 text-gold mt-1 shrink-0" />
                <span className="leading-relaxed">Vous gérez vos préférences depuis votre espace compte.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
