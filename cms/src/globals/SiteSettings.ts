import type { GlobalConfig } from 'payload'

import { authenticated, publicRead } from '../access'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Portal Ayarları',
  admin: { group: 'Genel Ayarlar' },
  access: { read: publicRead, update: authenticated },
  fields: [
    { name: 'portalName', label: 'Portal Adı', type: 'text', required: true, defaultValue: 'Tarihi ve Kültürel Miras Bilgi Sistemi' },
    { name: 'municipalityName', label: 'Kurum Adı', type: 'text', required: true, defaultValue: 'Hatay Büyükşehir Belediyesi' },
    { name: 'defaultDistrict', label: 'Varsayılan İlçe', type: 'text', defaultValue: 'Antakya' },
    { name: 'supportEmail', label: 'Destek E-postası', type: 'email' },
    { name: 'contentNotice', label: 'Yönetim Notu', type: 'textarea', defaultValue: 'Portalda yayımlanan eser, rota ve etkinlik içerikleri bu yönetim sisteminden kontrol edilir.' },
    {
      name: 'homeContent',
      label: 'Ana Sayfa İçeriği',
      type: 'json',
      admin: { description: 'Ana sayfadaki tanıtım alanları, bölüm başlıkları ve hızlı erişim bağlantıları.' },
    },
    {
      name: 'aboutContent',
      label: 'Hakkında Sayfası İçeriği',
      type: 'json',
      admin: { description: 'Hakkında sayfasındaki halka yönelik bütün metin ve bağlantılar.' },
    },
  ],
}
