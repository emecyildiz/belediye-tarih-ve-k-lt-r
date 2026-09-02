import type { CollectionConfig } from 'payload'
import { Forbidden } from 'payload'

import { adminsOnly } from '../access'
import { verifyCmsTwoFactorProof } from '../auth/twoFactorProof'

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
    create: adminsOnly,
    read: adminsOnly,
    update: adminsOnly,
    delete: adminsOnly,
  },
  hooks: {
    beforeLogin: [({ req, user }) => {
      const requestData = req.data as typeof req.data & { twoFactorProof?: string }
      const proof = typeof requestData?.twoFactorProof === 'string' ? requestData.twoFactorProof : null
      if (!verifyCmsTwoFactorProof(proof, user.email, user.role)) throw new Forbidden(req.t)
      return user
    }],
  },
  fields: [
    { name: 'name', label: 'Ad Soyad', type: 'text', required: true },
    { name: 'role', label: 'Yetki', type: 'select', required: true, defaultValue: 'editor', options: [{ label: 'Yönetici', value: 'admin' }, { label: 'İçerik Editörü', value: 'editor' }] },
  ],
}
