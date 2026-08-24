import type { CollectionConfig } from 'payload'

import { authenticated, publicRead } from '../access'

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  labels: { singular: 'Bildirim', plural: 'Bildirimler' },
  admin: { group: 'İletişim', useAsTitle: 'title', defaultColumns: ['title', 'type', 'publishedAt', 'active'] },
  access: { read: publicRead, create: authenticated, update: authenticated, delete: authenticated },
  fields: [
    { name: 'title', label: 'Başlık', type: 'text', required: true },
    { name: 'message', label: 'Bildirim Metni', type: 'textarea', required: true },
    { name: 'type', label: 'Tür', type: 'select', defaultValue: 'info', options: [{ label: 'Bilgi', value: 'info' }, { label: 'Etkinlik', value: 'event' }, { label: 'Duyuru', value: 'announcement' }, { label: 'Uyarı', value: 'warning' }] },
    { name: 'publishedAt', label: 'Yayın Tarihi', type: 'date', required: true, defaultValue: () => new Date().toISOString() },
    { name: 'active', label: 'Aktif', type: 'checkbox', defaultValue: true },
    { name: 'href', label: 'Bağlantı', type: 'text' },
  ],
}
