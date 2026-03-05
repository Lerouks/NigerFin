import { defineField, defineType } from 'sanity';

export const breakingNews = defineType({
  name: 'breakingNews',
  title: 'Breaking News',
  type: 'document',
  fields: [
    defineField({
      name: 'tag',
      title: 'Tag (ex: URGENT, FLASH)',
      type: 'string',
      initialValue: 'URGENT',
    }),
    defineField({
      name: 'text',
      title: 'Texte',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'active',
      title: 'Actif',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: { title: 'text', subtitle: 'tag', active: 'active' },
    prepare({ title, subtitle, active }) {
      return {
        title: `${active ? '🟢' : '🔴'} ${title}`,
        subtitle,
      };
    },
  },
});
