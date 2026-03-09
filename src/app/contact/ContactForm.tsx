'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, Send, Check } from 'lucide-react';

export function ContactForm() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        setError(data?.error || 'Une erreur est survenue. Veuillez réessayer.');
        return;
      }
      setSubmitted(true);
    } catch {
      setError('Impossible de contacter le serveur. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <section className="bg-[#111] text-white py-20 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-[11px] tracking-[0.2em] uppercase text-white/40 block mb-4">Contact</span>
          <h1 className="text-4xl md:text-5xl mb-4 leading-[1.1]">Parlons ensemble</h1>
          <p className="text-[16px] text-white/45 max-w-xl leading-relaxed">
            Une question, une suggestion ou une opportunité de partenariat ? Notre équipe est à votre écoute.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1 space-y-6">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#111] text-white rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Adresse</h3>
                    <p className="text-gray-600 text-sm">Niamey, Niger<br />Plateau &ndash; BP 800</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#111] text-white rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Email</h3>
                    <a href="mailto:contact@nfireport.com" className="text-gray-600 text-sm hover:text-black transition-colors block">contact@nfireport.com</a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#111] text-white rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Téléphone</h3>
                    <a href="tel:+22798543837" className="text-gray-600 text-sm hover:text-black transition-colors block">+227 98 54 38 37</a>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-lg border border-black/[0.06]">
                <h3 className="font-bold mb-3">Heures d&apos;ouverture</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between"><span>Lundi - Vendredi</span><span>08h00 - 18h00</span></div>
                  <div className="flex justify-between"><span>Samedi</span><span>09h00 - 13h00</span></div>
                  <div className="flex justify-between"><span>Dimanche</span><span>Fermé</span></div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              {submitted ? (
                <div className="text-center py-20 bg-white border border-black/[0.06] rounded-xl">
                  <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
                    <Check className="w-7 h-7 text-emerald-500" />
                  </div>
                  <h2 className="text-2xl mb-3 font-bold">Message envoyé</h2>
                  <p className="text-gray-600 mb-8">Merci pour votre message. Notre équipe vous répondra dans les plus brefs délais.</p>
                  <button
                    onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', subject: '', message: '' }); }}
                    className="bg-[#111] text-white px-8 py-3 rounded-lg hover:bg-[#333] transition-colors text-[14px]"
                  >
                    Envoyer un autre message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-white rounded-xl p-7 md:p-9 border border-black/[0.06] space-y-5">
                  <h2 className="text-2xl font-bold mb-2">Envoyez-nous un message</h2>
                  <p className="text-gray-500 mb-6">Remplissez le formulaire ci-dessous et nous reviendrons vers vous rapidement.</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-2">Nom complet</label>
                      <input id="name" type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border border-black/[0.08] rounded-lg px-4 py-2.5 bg-[#fafaf9] focus:outline-none focus:border-black/15 focus:ring-1 focus:ring-black/5 transition-all text-base" placeholder="Votre nom" />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
                      <input id="email" type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full border border-black/[0.08] rounded-lg px-4 py-2.5 bg-[#fafaf9] focus:outline-none focus:border-black/15 focus:ring-1 focus:ring-black/5 transition-all text-base" placeholder="votre@email.com" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium mb-2">Sujet</label>
                    <select id="subject" required value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} className="w-full border border-black/[0.08] rounded-lg px-4 py-2.5 bg-[#fafaf9] focus:outline-none focus:ring-1 focus:ring-black/5 transition-all text-base">
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
                    <textarea id="message" required rows={6} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className="w-full border border-black/[0.08] rounded-lg px-4 py-3 bg-[#fafaf9] focus:outline-none focus:border-black/15 focus:ring-1 focus:ring-black/5 resize-none transition-all text-base" placeholder="Votre message..." />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                      {error}
                    </div>
                  )}

                  <button type="submit" disabled={loading} className="bg-[#111] text-white px-7 py-3 rounded-lg hover:bg-[#333] transition-colors flex items-center gap-2 text-[14px] disabled:opacity-50">
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
