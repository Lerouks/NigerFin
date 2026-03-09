'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface LegalSection {
  id: string;
  heading: string;
  text: string;
  display_order: number;
  updated_at: string;
}

interface FallbackSection {
  heading: string;
  text: string;
}

interface DynamicLegalPageProps {
  slug: string;
  title: string;
  fallbackSections?: FallbackSection[];
}

export function DynamicLegalPage({ slug, title, fallbackSections }: DynamicLegalPageProps) {
  const [sections, setSections] = useState<LegalSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    fetch(`/api/legal-sections?page=${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setSections(data);
        } else {
          setUseFallback(true);
        }
      })
      .catch(() => { setUseFallback(true); })
      .finally(() => setLoading(false));
  }, [slug]);

  const lastUpdated = sections.length > 0
    ? new Date(Math.max(...sections.map((s) => new Date(s.updated_at).getTime())))
    : null;

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <section className="bg-[#111] text-white py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl">{title}</h1>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl p-7 md:p-10 border border-black/[0.06]">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : useFallback && fallbackSections ? (
              <div className="space-y-10">
                {fallbackSections.map((section, index) => (
                  <div key={index}>
                    <h2 className="text-xl font-bold mb-3">{section.heading}</h2>
                    <p className="text-gray-600 leading-relaxed">{section.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-10">
                {sections.map((section) => (
                  <div key={section.id}>
                    <h2 className="text-xl font-bold mb-3">{section.heading}</h2>
                    <p className="text-gray-600 leading-relaxed">{section.text}</p>
                  </div>
                ))}
              </div>
            )}

            {lastUpdated && (
              <div className="mt-8 text-center">
                <p className="text-[12px] text-gray-400">
                  Dernière mise à jour : {lastUpdated.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
