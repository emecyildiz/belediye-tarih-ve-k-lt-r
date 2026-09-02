import type { CollectionConfig } from 'payload'

import { adminsOnly, authenticated, publishedOrAuthenticated } from '../access'

export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: 'Etkinlik', plural: 'Etkinlikler' },
  admin: { group: 'İçerik Yönetimi', useAsTitle: 'title', defaultColumns: ['title', 'date', 'district', 'featured'] },
  access: { read: publishedOrAuthenticated, create: authenticated, update: authenticated, delete: adminsOnly },
  versions: { drafts: true, maxPerDoc: 20 },
  fields: [
    { name: 'legacyId', label: 'Portal Kayıt No', type: 'number', required: true, unique: true, index: true },
    { name: 'title', label: 'Etkinlik Adı', type: 'text', required: true, index: true },
    { name: 'slug', label: 'URL Adı', type: 'text', required: true, unique: true, index: true },
    {
      type: 'row',
      fields: [
        { name: 'category', label: 'Kategori', type: 'select', required: true, options: [{ label: 'Gezi / Tur', value: 'gezi' }, { label: 'Atölye', value: 'atolye' }, { label: 'Festival', value: 'festival' }, { label: 'Sanat', value: 'sanat' }, { label: 'Kültürel Etkinlik', value: 'kultur' }, { label: 'Konferans / Panel', value: 'konferans' }, { label: 'Sergi', value: 'sergi' }] },
        { name: 'categoryLabel', label: 'Kategori Başlığı', type: 'text', required: true },
        { name: 'featured', label: 'Öne Çıkan', type: 'checkbox', defaultValue: false },
      ],
    },
    { name: 'description', label: 'Açıklama', type: 'textarea' },
    {
      type: 'row',
      fields: [
        { name: 'district', label: 'İlçe', type: 'text', required: true, index: true },
        { name: 'venue', label: 'Mekân', type: 'text', required: true },
        { name: 'location', label: 'Adres / Konum Açıklaması', type: 'text' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'date', label: 'Tarih', type: 'date', required: true, index: true, admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' } } },
        { name: 'time', label: 'Saat', type: 'text', required: true },
      ],
    },
    { name: 'imageMedia', label: 'Etkinlik Görseli', type: 'upload', relationTo: 'media', admin: { description: 'Etkinlik kartında, takvim başlığında ve ayrıntı sayfasında kullanılır.' } },
    { name: 'image', label: 'Eski Etkinlik Görseli URL', type: 'text', admin: { hidden: true } },
  ],
}
