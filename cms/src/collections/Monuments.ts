import type { CollectionConfig } from 'payload'

import { adminsOnly, authenticated, publishedOrAuthenticated } from '../access'

export const Monuments: CollectionConfig = {
  slug: 'monuments',
  labels: { singular: 'Tarihi Eser', plural: 'Tarihi Eserler' },
  admin: {
    group: 'İçerik Yönetimi',
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'district', 'updatedAt'],
  },
  access: { read: publishedOrAuthenticated, create: authenticated, update: authenticated, delete: adminsOnly },
  versions: { drafts: true, maxPerDoc: 20 },
  fields: [
    { name: 'legacyId', label: 'Portal Kayıt No', type: 'number', required: true, unique: true, index: true },
    { name: 'name', label: 'Eser Adı', type: 'text', required: true, index: true },
    { name: 'slug', label: 'URL Adı', type: 'text', required: true, unique: true, index: true },
    {
      type: 'row',
      fields: [
        { name: 'type', label: 'Yapı Türü', type: 'select', defaultValue: 'yapi', options: [{ label: 'Yapı', value: 'yapi' }, { label: 'Anıt', value: 'anit' }, { label: 'Doğal Alan', value: 'doga' }] },
        { name: 'category', label: 'Kategori', type: 'select', required: true, options: [{ label: 'Cami', value: 'camii' }, { label: 'Kilise', value: 'kilise' }, { label: 'Müze', value: 'muze' }, { label: 'Han', value: 'han' }, { label: 'Kale', value: 'kale' }, { label: 'Köprü', value: 'kopru' }, { label: 'Doğal Güzellik', value: 'doga' }, { label: 'Diğer', value: 'diger' }] },
        { name: 'district', label: 'İlçe', type: 'text', required: true, index: true },
      ],
    },
    { name: 'period', label: 'Dönem', type: 'text' },
    { name: 'century', label: 'Yapım Tarihi / Yüzyıl', type: 'text' },
    { name: 'address', label: 'Adres', type: 'textarea' },
    { name: 'routeLabel', label: 'Rota Etiketi', type: 'text' },
    { name: 'description', label: 'Kısa Açıklama', type: 'textarea' },
    { name: 'longDescription', label: 'Ayrıntılı Açıklama', type: 'textarea' },
    {
      type: 'row',
      fields: [
        { name: 'protectionStatus', label: 'Koruma Durumu', type: 'text' },
        { name: 'registrationNo', label: 'Envanter No', type: 'text' },
        { name: 'registrationStatus', label: 'Tescil Durumu', type: 'text' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'workingHours', label: 'Ziyaret Saatleri', type: 'text' },
        { name: 'entryFee', label: 'Giriş', type: 'text' },
        { name: 'distance', label: 'Merkeze Uzaklık', type: 'text' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'rating', label: 'Puan', type: 'number', min: 0, max: 5 },
        { name: 'reviewCount', label: 'Değerlendirme Sayısı', type: 'number', min: 0 },
        { name: 'featured', label: 'Öne Çıkan', type: 'checkbox', defaultValue: false },
      ],
    },
    { name: 'imageMedia', label: 'Ana Görsel', type: 'upload', relationTo: 'media', admin: { description: 'Portal kartlarında ve eser ayrıntısında kullanılacak ana görsel.' } },
    { name: 'galleryMedia', label: 'Fotoğraf Galerisi', type: 'array', fields: [{ name: 'media', label: 'Görsel', type: 'upload', relationTo: 'media', required: true }] },
    { name: 'image', label: 'Eski Ana Görsel URL', type: 'text', admin: { hidden: true } },
    { name: 'gallery', label: 'Eski Galeri URL Alanları', type: 'array', admin: { hidden: true }, fields: [{ name: 'url', label: 'Görsel URL', type: 'text', required: true }] },
    {
      name: 'coordinates',
      label: 'Konum',
      type: 'group',
      fields: [
        { name: 'latitude', label: 'Enlem', type: 'number', required: true, min: -90, max: 90 },
        { name: 'longitude', label: 'Boylam', type: 'number', required: true, min: -180, max: 180 },
      ],
    },
    { name: 'highlights', label: 'Öne Çıkan Özellikler', type: 'array', fields: [{ name: 'text', label: 'Özellik', type: 'text', required: true }] },
    { name: 'timeline', label: 'Tarihçe', type: 'array', fields: [{ name: 'year', label: 'Dönem', type: 'text', required: true }, { name: 'text', label: 'Açıklama', type: 'textarea', required: true }] },
  ],
}
