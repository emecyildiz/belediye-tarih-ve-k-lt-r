import type { CollectionConfig } from 'payload'

import { authenticated, publicRead } from '../access'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Medya', plural: 'Medya Dosyaları' },
  admin: { group: 'İçerik Yönetimi', useAsTitle: 'alt' },
  access: {
    read: publicRead,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: {
    mimeTypes: ['image/*'],
    imageSizes: [
      { name: 'thumbnail', width: 360, height: 240, position: 'centre' },
      { name: 'card', width: 720, height: 480, position: 'centre' },
    ],
  },
}
