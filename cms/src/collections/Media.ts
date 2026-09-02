import type { CollectionConfig } from 'payload'

import { adminsOnly, authenticated, publicRead } from '../access'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Medya', plural: 'Medya Dosyaları' },
  admin: { group: 'İçerik Yönetimi', useAsTitle: 'alt', defaultColumns: ['filename', 'alt', 'credit', 'updatedAt'] },
  access: {
    read: publicRead,
    create: authenticated,
    update: authenticated,
    delete: adminsOnly,
  },
  fields: [
    {
      name: 'alt',
      label: 'Alternatif Metin',
      type: 'text',
      required: true,
      admin: { description: 'Ekran okuyucular için görseli kısa ve anlaşılır biçimde açıklayın.' },
    },
    { name: 'caption', label: 'Açıklama', type: 'textarea' },
    { name: 'credit', label: 'Fotoğraf / Kaynak Sahibi', type: 'text' },
    { name: 'sourceUrl', label: 'Kaynak Adresi', type: 'text' },
    { name: 'license', label: 'Kullanım / Lisans Bilgisi', type: 'text' },
  ],
  upload: {
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    constructorOptions: { limitInputPixels: 40_000_000 },
    imageSizes: [
      { name: 'thumbnail', width: 360, height: 240, position: 'centre' },
      { name: 'card', width: 720, height: 480, position: 'centre' },
    ],
  },
}
