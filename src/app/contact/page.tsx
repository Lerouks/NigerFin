import type { Metadata } from 'next';
import { ContactForm } from './ContactForm';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contactez l\'équipe NFI Report. Questions, partenariats ou suggestions.',
  openGraph: {
    title: 'Contactez NFI Report',
    description: 'Contactez l\'équipe NFI Report. Questions, partenariats ou suggestions.',
    type: 'website',
  },
};

export default function ContactPage() {
  return <ContactForm />;
}
