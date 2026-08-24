import type { CollectionConfig } from 'payload'

import { authenticated, publicRead } from '../access'

export const CulturalRoutes: CollectionConfig = {
  slug: 'cultural-routes',
  labels: { singular: 'Kültürel Rota', plural: 'Kültürel Rotalar' },
  admin: { group: 'İçerik Yönetimi', useAsTitle: 'title', defaultColumns: ['title', 'district', 'difficulty', 'updatedAt'] },
  access: { read: publicRead, create: authenticated, update: authenticated, delete: authenticated },
  versions: { drafts: true, maxPerDoc: 20 },
  fields: [
    { name: 'legacyId', label: 'Portal Kayıt No', type: 'number', required: true, unique: true, index: true },
    { name: 'title', label: 'Rota Adı', type: 'text', required: true, index: true },
    { name: 'slug', label: 'URL Adı', type: 'text', required: true, unique: true, index: true },
    {
      type: 'row',
      fields: [
        { name: 'category', label: 'Kategori', type: 'select', required: true, options: [{ label: 'Tarihi', value: 'tarihi' }, { label: 'İnanç', value: 'inanc' }, { label: 'Gastronomi', value: 'gastronomi' }, { label: 'Doğa', value: 'doga' }] },
        { name: 'categoryLabel', label: 'Kategori Başlığı', type: 'text', required: true },
        { name: 'district', label: 'İlçe / Bölge', type: 'text', required: true, index: true },
      ],
    },
    { name: 'description', label: 'Açıklama', type: 'textarea' },
    {
      type: 'row',
      fields: [
        { name: 'duration', label: 'Tahmini Süre', type: 'text', required: true },
        { name: 'distance', label: 'Toplam Mesafe', type: 'text', required: true },
        { name: 'difficulty', label: 'Zorluk', type: 'select', required: true, options: [{ label: 'Kolay', value: 'kolay' }, { label: 'Orta', value: 'orta' }, { label: 'Zor', value: 'zor' }] },
        { name: 'difficultyLabel', label: 'Zorluk Başlığı', type: 'text' },
      ],
    },
    { name: 'travelMode', label: 'Ulaşım Türü', type: 'select', defaultValue: 'walking', options: [{ label: 'Yürüyüş', value: 'walking' }, { label: 'Bisiklet', value: 'cycling' }, { label: 'Araç', value: 'driving' }] },
    { name: 'image', label: 'Kapak Görseli URL', type: 'text' },
    { name: 'color', label: 'Harita Rengi', type: 'text', defaultValue: '#2563eb' },
    { name: 'featured', label: 'Öne Çıkan', type: 'checkbox', defaultValue: false },
    { name: 'monuments', label: 'Rota Durakları', type: 'relationship', relationTo: 'monuments', hasMany: true, required: true, minRows: 1, admin: { description: 'Durak sırası bu listedeki sıraya göre oluşturulur.' } },
  ],
}
