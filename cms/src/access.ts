import type { Access } from 'payload'

export const authenticated: Access = ({ req }) => Boolean(req.user)
export const publicRead: Access = () => true
export const adminsOnly: Access = ({ req }) => req.user?.role === 'admin'
export const firstUserOrAdmin: Access = async ({ req }) => {
  if (req.user?.role === 'admin') return true
  const result = await req.payload.count({ collection: 'users', overrideAccess: true })
  return result.totalDocs === 0
}
