import { defineField, defineType } from 'sanity';

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Paramètres du site',
  type: 'document',
  fields: [
    defineField({
      name: 'siteName',
      title: 'Nom du site',
      type: 'string',
    }),
    defineField({
      name: 'siteDescription',
      title: 'Description',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'contactEmail',
      title: 'Email de contact',
      type: 'string',
    }),
    defineField({
      name: 'socialLinks',
      title: 'Réseaux sociaux',
      type: 'object',
      fields: [
        { name: 'facebook', title: 'Facebook', type: 'url' },
        { name: 'twitter', title: 'Twitter / X', type: 'url' },
        { name: 'linkedin', title: 'LinkedIn', type: 'url' },
        { name: 'instagram', title: 'Instagram', type: 'url' },
        { name: 'youtube', title: 'YouTube', type: 'url' },
        { name: 'tiktok', title: 'TikTok', type: 'url' },
      ],
    }),
    defineField({
      name: 'navigation',
      title: 'Navigation principale',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'label', title: 'Libellé', type: 'string' },
            { name: 'path', title: 'Chemin', type: 'string' },
            { name: 'order', title: 'Ordre', type: 'number' },
          ],
          preview: {
            select: { title: 'label', subtitle: 'path' },
          },
        },
      ],
    }),
    defineField({
      name: 'footerSections',
      title: 'Sections du pied de page',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'title', title: 'Titre', type: 'string' },
            {
              name: 'links',
              title: 'Liens',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    { name: 'label', title: 'Libellé', type: 'string' },
                    { name: 'path', title: 'Chemin', type: 'string' },
                  ],
                },
              ],
            },
          ],
          preview: {
            select: { title: 'title' },
          },
        },
      ],
    }),
  ],
  preview: {
    prepare() {
      return { title: 'Paramètres du site' };
    },
  },
});
