import { defineField, defineType } from 'sanity';

export const tool = defineType({
  name: 'tool',
  title: 'Outil',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Nom',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'icon',
      title: 'Icône',
      type: 'string',
      description: 'Nom de l\'icône Lucide (Calculator, TrendingUp, Percent, DollarSign, BarChart3, Wrench)',
      options: {
        list: [
          { title: 'Calculator', value: 'Calculator' },
          { title: 'TrendingUp', value: 'TrendingUp' },
          { title: 'Percent', value: 'Percent' },
          { title: 'DollarSign', value: 'DollarSign' },
          { title: 'BarChart3', value: 'BarChart3' },
          { title: 'Wrench', value: 'Wrench' },
        ],
      },
    }),
    defineField({
      name: 'isPremium',
      title: 'Premium',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'order',
      title: 'Ordre d\'affichage',
      type: 'number',
      initialValue: 0,
    }),
  ],
  preview: {
    select: { title: 'name', isPremium: 'isPremium' },
    prepare({ title, isPremium }) {
      return { title: `${isPremium ? '🔒 ' : ''}${title}` };
    },
  },
});
