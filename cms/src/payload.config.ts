import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Monuments } from './collections/Monuments'
import { CulturalRoutes } from './collections/CulturalRoutes'
import { Events } from './collections/Events'
import { Notifications } from './collections/Notifications'
import { SiteSettings } from './globals/SiteSettings'
import { migrations } from './migrations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  bodyParser: {
    limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 100 },
  },
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: ' · TKMBS İçerik Yönetimi',
      description: 'Hatay tarihi ve kültürel miras içerik yönetim sistemi',
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      beforeNavLinks: ['/components/PortalUsersNavLink', '/components/ReportsNavLink'],
      views: {
        reports: {
          Component: '/components/ReportsView',
          path: '/raporlar',
        },
        portalUsers: {
          Component: '/components/PortalUsersView',
          path: '/portal-kullanicilari',
        },
      },
    },
  },
  collections: [Users, Media, Monuments, CulturalRoutes, Events, Notifications],
  globals: [SiteSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    // Portal kimlik tabloları aynı PostgreSQL veritabanında tutulur.
    // Otomatik dev push yabancı tabloları silmeye çalışmasın; şema değişiklikleri migration ile uygulanır.
    push: false,
    prodMigrations: migrations,
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  cors: [process.env.PORTAL_ORIGIN || 'http://localhost:5173'],
  csrf: [process.env.PORTAL_ORIGIN || 'http://localhost:5173'],
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',
  sharp,
  plugins: [],
})
