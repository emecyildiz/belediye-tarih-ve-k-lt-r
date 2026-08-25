import { config as loadEnv } from 'dotenv'
import { getPayload } from 'payload'

import { events } from '../../backend/data/events.js'
import { notifications } from '../../backend/data/mockDb.js'
import { monuments } from '../../backend/data/monuments.js'
import { culturalRoutes } from '../../backend/data/routes.js'
loadEnv({ path: new URL('../.env', import.meta.url) })

const { default: config } = await import('./payload.config')
const payload = await getPayload({ config })

if (process.env.AUTH_SEED_DEMO_USERS !== 'false') {
  const demoPassword = process.env.DEMO_USER_PASSWORD || 'Belediye2026!'
  const demoManagers = [
    { email: 'admin@tkmbs.local', name: 'Sistem Yöneticisi', role: 'admin' as const },
    { email: 'editor@tkmbs.local', name: 'İçerik Editörü', role: 'editor' as const },
  ]
  for (const manager of demoManagers) {
    const existing = await payload.find({ collection: 'users', where: { email: { equals: manager.email } }, limit: 1, overrideAccess: true })
    if (existing.docs[0]) await payload.update({ collection: 'users', id: existing.docs[0].id, data: { ...manager, password: demoPassword }, overrideAccess: true })
    else await payload.create({ collection: 'users', data: { ...manager, password: demoPassword }, overrideAccess: true })
  }
}

function slugify(value: string) {
  return value
    .toLocaleLowerCase('tr-TR')
    .replaceAll('ı', 'i')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function upsertByLegacyId(collection: 'monuments' | 'cultural-routes' | 'events', legacyId: number, data: Record<string, unknown>) {
  const existing = await payload.find({
    collection,
    where: { legacyId: { equals: legacyId } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  if (existing.docs[0]) {
    return payload.update({ collection, id: existing.docs[0].id, data: data as never, draft: false, overrideAccess: true })
  }

  return payload.create({ collection, data: data as never, draft: false, overrideAccess: true })
}

const monumentIdMap = new Map<number, number | string>()

for (const item of monuments) {
  const saved = await upsertByLegacyId('monuments', item.id, {
    legacyId: item.id,
    name: item.name,
    slug: item.slug,
    type: item.type || 'yapi',
    category: item.category || 'diger',
    district: item.district || 'Hatay',
    period: item.period,
    century: item.century,
    address: item.address,
    routeLabel: item.route,
    description: item.description,
    longDescription: item.longDescription,
    protectionStatus: item.protectionStatus,
    registrationNo: item.registrationNo,
    registrationStatus: item.registrationStatus,
    workingHours: item.workingHours,
    entryFee: item.entryFee,
    distance: item.distance,
    rating: item.rating,
    reviewCount: item.reviewCount,
    featured: item.id <= 6,
    image: item.image,
    gallery: (item.images || []).map((url: string) => ({ url })),
    coordinates: { latitude: item.coordinates[0], longitude: item.coordinates[1] },
    highlights: (item.highlights || []).map((text: string) => ({ text })),
    timeline: (item.timeline || []).map((entry: { year: string; text: string }) => entry),
    _status: 'published',
  })
  monumentIdMap.set(item.id, saved.id)
}

for (const item of culturalRoutes) {
  await upsertByLegacyId('cultural-routes', item.id, {
    legacyId: item.id,
    title: item.title,
    slug: item.slug,
    category: item.category,
    categoryLabel: item.categoryLabel,
    district: item.district,
    description: item.description,
    duration: item.duration,
    distance: item.distance,
    difficulty: item.difficulty,
    difficultyLabel: item.difficultyLabel,
    travelMode: 'travelMode' in item ? item.travelMode : 'walking',
    image: item.image,
    color: item.color,
    featured: item.id <= 6,
    monuments: item.monumentIds.map((id: number) => monumentIdMap.get(id)).filter(Boolean),
    _status: 'published',
  })
}

for (const item of events) {
  await upsertByLegacyId('events', item.id, {
    legacyId: item.id,
    title: item.title,
    slug: 'slug' in item && item.slug ? item.slug : slugify(item.title),
    category: item.category,
    categoryLabel: item.categoryLabel,
    description: item.description,
    location: item.location,
    district: item.district,
    venue: item.venue,
    date: new Date(`${item.date}T12:00:00+03:00`).toISOString(),
    time: item.time,
    image: item.image,
    featured: Boolean(item.featured),
    _status: 'published',
  })
}

const notificationTypeMap: Record<string, 'info' | 'event' | 'announcement' | 'warning'> = {
  event: 'event',
  monument: 'announcement',
  route: 'announcement',
  system: 'info',
}

for (const item of notifications) {
  const existing = await payload.find({ collection: 'notifications', where: { title: { equals: item.title } }, limit: 1, overrideAccess: true })
  const data = {
    title: item.title,
    message: item.message,
    type: notificationTypeMap[item.type] || 'info',
    publishedAt: item.createdAt,
    active: true,
    href: item.link,
  }
  if (existing.docs[0]) await payload.update({ collection: 'notifications', id: existing.docs[0].id, data, overrideAccess: true })
  else await payload.create({ collection: 'notifications', data, overrideAccess: true })
}

await payload.updateGlobal({
  slug: 'site-settings',
  data: {
    portalName: 'Tarihi ve Kültürel Miras Bilgi Sistemi',
    municipalityName: 'Hatay Büyükşehir Belediyesi',
    defaultDistrict: 'Antakya',
    contentNotice: 'Portalda yayımlanan eser, rota ve etkinlik içerikleri Payload CMS üzerinden kontrol edilir.',
  },
  overrideAccess: true,
})

console.log(`Seed tamamlandı: ${monuments.length} eser, ${culturalRoutes.length} rota, ${events.length} etkinlik ve yönetim hesapları.`)
await payload.destroy()
process.exit(0)
