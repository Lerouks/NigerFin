import { defineField, defineType } from 'sanity';

export const legalPage = defineType({
  name: 'legalPage',
  title: 'Page légale',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Titre',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'sections',
      title: 'Sections',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'heading', title: 'Titre', type: 'string' },
            { name: 'text', title: 'Texte', type: 'text' },
          ],
          preview: {
            select: { title: 'heading' },
          },
        },
      ],
    }),
    defineField({
      name: 'lastUpdated',
      title: 'Dernière mise à jour',
      type: 'date',
    }),
  ],
});
