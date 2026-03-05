'use client';

import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from '@/sanity/schemas';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';

export default defineConfig({
  name: 'nfi-report',
  title: 'NFI Report — CMS',
  projectId,
  dataset,
  basePath: '/studio',
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Contenu')
          .items([
            S.listItem()
              .title('Articles')
              .schemaType('article')
              .child(
                S.documentTypeList('article')
                  .title('Articles')
                  .defaultOrdering([{ field: 'publishedAt', direction: 'desc' }])
              ),
            S.listItem()
              .title('Auteurs')
              .schemaType('author')
              .child(S.documentTypeList('author').title('Auteurs')),
            S.divider(),
            S.listItem()
              .title('Breaking News')
              .schemaType('breakingNews')
              .child(S.documentTypeList('breakingNews').title('Breaking News')),
            S.listItem()
              .title('Outils')
              .schemaType('tool')
              .child(S.documentTypeList('tool').title('Outils')),
            S.divider(),
            S.listItem()
              .title('Pages')
              .schemaType('page')
              .child(S.documentTypeList('page').title('Pages')),
            S.listItem()
              .title('Pages légales')
              .schemaType('legalPage')
              .child(S.documentTypeList('legalPage').title('Pages légales')),
            S.divider(),
            S.listItem()
              .title('Paramètres du site')
              .child(
                S.editor()
                  .schemaType('siteSettings')
                  .documentId('siteSettings')
                  .title('Paramètres du site')
              ),
          ]),
    }),
    visionTool({ defaultApiVersion: '2024-01-01' }),
  ],
  schema: {
    types: schemaTypes,
  },
});
