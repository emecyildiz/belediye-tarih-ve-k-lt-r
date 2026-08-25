import type { CollectionConfig } from 'payload'

import { adminsOnly, firstUserOrAdmin } from '../access'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Yönetici', plural: 'Yöneticiler' },
  admin: {
    group: 'Sistem',
    useAsTitle: 'name',
  },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
  },
  access: {
    admin: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'editor',
    create: firstUserOrAdmin,
    read: adminsOnly,
    update: adminsOnly,
    delete: adminsOnly,
  },
  fields: [
    { name: 'name', label: 'Ad Soyad', type: 'text', required: true },
    { name: 'role', label: 'Yetki', type: 'select', required: true, defaultValue: 'editor', options: [{ label: 'Yönetici', value: 'admin' }, { label: 'İçerik Editörü', value: 'editor' }] },
  ],
}
