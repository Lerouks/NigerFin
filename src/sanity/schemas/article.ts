import { defineField, defineType } from 'sanity';

export const article = defineType({
  name: 'article',
  title: 'Article',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Titre',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'subtitle',
      title: 'Sous-titre',
      type: 'string',
    }),
    defineField({
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Extrait',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'category',
      title: 'Catégorie',
      type: 'string',
      options: {
        list: [
          { title: 'Économie', value: 'economie' },
          { title: 'Finance', value: 'finance' },
          { title: 'Marchés', value: 'marches' },
          { title: 'Entreprises', value: 'entreprises' },
          { title: 'Éducation', value: 'education' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'author',
      title: 'Auteur',
      type: 'reference',
      to: [{ type: 'author' }],
    }),
    defineField({
      name: 'mainImage',
      title: 'Image principale',
      type: 'image',
      options: { hotspot: true },
      fields: [
        {
          name: 'alt',
          title: 'Texte alternatif',
          type: 'string',
          description: 'Important pour le SEO et l\'accessibilité',
        },
      ],
    }),
    defineField({
      name: 'publishedAt',
      title: 'Date de publication',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'body',
      title: 'Contenu',
      type: 'array',
      of: [
        { type: 'block' },
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            {
              name: 'caption',
              title: 'Légende',
              type: 'string',
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'isPremium',
      title: 'Article Premium',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'contentType',
      title: 'Niveau d\'accès',
      type: 'string',
      options: {
        list: [
          { title: 'Gratuit', value: 'free' },
          { title: 'Premium (Standard+)', value: 'premium' },
          { title: 'Pro uniquement', value: 'pro' },
        ],
      },
      initialValue: 'free',
    }),
    defineField({
      name: 'readTime',
      title: 'Temps de lecture (min)',
      type: 'number',
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        { name: 'metaTitle', title: 'Titre SEO', type: 'string' },
        { name: 'metaDescription', title: 'Description SEO', type: 'text', rows: 2 },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      author: 'author.name',
      media: 'mainImage',
      category: 'category',
      contentType: 'contentType',
    },
    prepare({ title, author, media, category, contentType }) {
      const badge = contentType === 'pro' ? '🔒 PRO — ' : contentType === 'premium' ? '🔒 ' : '';
      return {
        title: `${badge}${title}`,
        subtitle: `${category || ''} ${author ? `— ${author}` : ''}`,
        media,
      };
    },
  },
  orderings: [
    {
      title: 'Date de publication (récent)',
      name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
  ],
});
