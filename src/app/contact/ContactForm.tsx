'use client';

import { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Send, Check } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface ContactSection {
  heading: string;
  text: string;
  display_order: number;
}

export function ContactForm() {
  const { show } = useToast();
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [contactInfo, setContactInfo] = useState<ContactSection[]>([]);

  useEffect(() => {
    fetch('/api/legal-sections?page=contact')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setContactInfo(data);
      })
      .catch(() => {});
  }, []);

  const getInfo = (order: number, fallback: string) => {
    const section = contactInfo.find((s) => s.display_order === order);
    return section?.text || fallback;
  };

  const address = getInfo(1, 'Niamey, Niger\nPlateau, BP 800');
  const email = getInfo(2, 'contact@nfireport.com');
  const phone = getInfo(3, '+227 91 70 71 94');
  const hoursText = getInfo(4, 'Lundi au vendredi : 08h00 à 18h00 | Samedi : 09h00 à 13h00 | Dimanche : fermé');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const msg = data?.error || 'Une erreur est survenue. Veuillez réessayer.';
        setError(msg);
        show(msg, 'error');
        return;
      }
      setSubmitted(true);
      show('Message envoyé. Nous vous répondons rapidement.', 'success');
    } catch {
      const msg = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
      setError(msg);
      show(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-[#0d0d0d] text-white py-20 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 hero-grid-pattern" />
        <div className="absolute top-0 inset-x-0 h-[2px] bg-linear-to-r from-transparent via-gold/40 to-transparent" />
        <div className="absolute -bottom-20 right-0 w-72 h-72 bg-gold/3 rounded-full blur-3xl" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="inline-flex items-center gap-2.5 mb-4 animate-fade-in">
            <span className="text-[11px] tracking-[0.2em] uppercase text-gold/60 font-semibold">Contact</span>
          </div>
          <h1 className="text-4xl md:text-5xl mb-4 leading-[1.1] animate-fade-in-up delay-100">Parlons ensemble</h1>
          <p className="text-[16px] text-white/40 max-w-xl leading-relaxed animate-fade-in-up delay-150">
            Une question, une suggestion ou une opportunité de partenariat ? Notre équipe est à votre écoute.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Info */}
            <div className="lg:col-span-1 space-y-6">
              <div className="space-y-6">
                {[
                  { icon: MapPin, label: 'Adresse', content: address.split('\n').map((line, i) => <span key={i}>{i > 0 && <br />}{line}</span>) },
                  { icon: Mail, label: 'Email', content: <a href={`mailto:${email}`} className="text-gray-600 text-sm hover:text-gold transition-colors">{email}</a> },
                  { icon: Phone, label: 'Téléphone', content: <a href={`tel:${phone.replace(/\s/g, '')}`} className="text-gray-600 text-sm hover:text-gold transition-colors">{phone}</a> },
                ].map(({ icon: Icon, label, content }) => (
                  <div key={label} className="flex items-start gap-4 group">
                    <div className="w-10 h-10 bg-[#111] text-white rounded-xl flex items-center justify-center shrink-0 group-hover:bg-gold transition-colors duration-300">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{label}</h3>
                      <p className="text-gray-600 text-sm">{content}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white p-5 rounded-xl border border-black/6 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-[2px] bg-linear-to-r from-transparent via-gold/20 to-transparent" />
                <h3 className="font-bold mb-3">Heures d&apos;ouverture</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  {hoursText.split('|').map((line, i) => {
                    const parts = line.trim().split(/\s*:\s*/);
                    const label = parts[0] || '';
                    const value = parts.slice(1).join(':') || '';
                    return (
                      <div key={i} className="flex justify-between">
                        <span>{label}</span>
                        <span className="font-medium text-gray-700">{value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-2">
              {submitted ? (
                <div className="text-center py-20 bg-white border border-black/6 rounded-2xl animate-fade-in-up">
                  <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
                    <Check className="w-7 h-7 text-emerald-500" />
                  </div>
                  <h2 className="text-2xl mb-3 font-bold">Message envoyé</h2>
                  <p className="text-gray-600 mb-8">Merci pour votre message. Notre équipe vous répondra dans les plus brefs délais.</p>
                  <button
                    onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', subject: '', message: '' }); }}
                    className="bg-[#111] text-white px-8 py-3 rounded-xl hover:bg-[#222] transition-colors text-[14px]"
                  >
                    Envoyer un autre message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-7 md:p-9 border border-black/6 space-y-5 relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-[2px] bg-linear-to-r from-transparent via-gold/20 to-transparent" />
                  <h2 className="text-2xl font-bold mb-2">Envoyez-nous un message</h2>
                  <p className="text-gray-500 mb-6">Remplissez le formulaire ci-dessous et nous reviendrons vers vous rapidement.</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-2">Nom complet</label>
                      <input id="name" type="text" required value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full border border-black/8 rounded-xl px-4 py-2.5 bg-background focus:outline-hidden focus:border-gold/30 focus:ring-2 focus:ring-gold/10 transition-all text-base" placeholder="Votre nom" />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
                      <input id="email" type="email" required value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} className="w-full border border-black/8 rounded-xl px-4 py-2.5 bg-background focus:outline-hidden focus:border-gold/30 focus:ring-2 focus:ring-gold/10 transition-all text-base" placeholder="votre@email.com" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium mb-2">Sujet</label>
                    <select id="subject" required value={formData.subject} onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))} className="w-full border border-black/8 rounded-xl px-4 py-2.5 bg-background focus:outline-hidden focus:ring-2 focus:ring-gold/10 transition-all text-base">
                      <option value="">Choisir un sujet</option>
                      <option value="general">Question générale</option>
                      <option value="partenariat">Partenariat / Publicité</option>
                      <option value="redaction">Proposition d&apos;article</option>
                      <option value="technique">Support technique</option>
                      <option value="abonnement">Abonnement Premium</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-2">Message</label>
                    <textarea id="message" required rows={6} value={formData.message} onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))} className="w-full border border-black/8 rounded-xl px-4 py-3 bg-background focus:outline-hidden focus:border-gold/30 focus:ring-2 focus:ring-gold/10 resize-none transition-all text-base" placeholder="Votre message..." />
                  </div>

                  {error && (
                    <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                      {error}
                    </div>
                  )}

                  <button type="submit" disabled={loading} className="bg-[#111] text-white px-7 py-3 rounded-xl hover:bg-[#222] transition-all duration-200 flex items-center gap-2 text-[14px] disabled:opacity-50 active:scale-[0.98] font-medium">
                    <Send className="w-4 h-4" />
                    {loading ? 'Envoi...' : 'Envoyer le message'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
