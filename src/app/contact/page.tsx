import type { Metadata } from 'next';
import { ContactForm } from './ContactForm';
import { ContactSeoBlock } from './ContactSeoBlock';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Contact : questions, partenariats, presse',
  description: 'Contactez l\'équipe NFI Report. Questions, partenariats, suggestions ou demandes presse.',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contact : questions, partenariats, presse',
    description: 'Contactez l\'équipe NFI Report. Questions, partenariats, suggestions ou demandes presse.',
    type: 'website',
  },
};

export default function ContactPage() {
  return (
    <>
      <ContactForm />
      <ContactSeoBlock />
    </>
  );
}
