import type { Access } from 'payload'

export const authenticated: Access = ({ req }) => Boolean(req.user)
export const publicRead: Access = () => true
export const adminsOnly: Access = ({ req }) => req.user?.role === 'admin'
export const publishedOrAuthenticated: Access = ({ req }) => req.user
  ? true
  : { _status: { equals: 'published' } }
export const activeNotificationOrAuthenticated: Access = ({ req }) => req.user
  ? true
  : {
      active: { equals: true },
      publishedAt: { less_than_equal: new Date().toISOString() },
    }
