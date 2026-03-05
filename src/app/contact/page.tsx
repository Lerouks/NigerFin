import type { Metadata } from 'next';
import { ContactForm } from './ContactForm';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contactez l\'équipe NFI Report. Questions, partenariats ou suggestions.',
};

export default function ContactPage() {
  return <ContactForm />;
}
