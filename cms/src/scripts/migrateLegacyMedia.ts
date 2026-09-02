import { config as loadEnv } from 'dotenv'
import { fileURLToPath } from 'node:url'
import { getPayload } from 'payload'

loadEnv({ path: new URL('../../.env', import.meta.url) })

const { default: config } = await import('../payload.config')
const payload = await getPayload({ config })
const mediaIdByUrl = new Map<string, number | string | null>()

async function ensureMedia(imageUrl: unknown, alt: string) {
  const url = String(imageUrl || '')
  if (!url.startsWith('/assets/')) return null
  if (mediaIdByUrl.has(url)) return mediaIdByUrl.get(url) || null

  const filename = url.split('/').pop() as string
  const existing = await payload.find({ collection: 'media', where: { filename: { equals: filename } }, limit: 1, overrideAccess: true })
  if (existing.docs[0]) {
    mediaIdByUrl.set(url, existing.docs[0].id)
    return existing.docs[0].id
  }

  const saved = await payload.create({
    collection: 'media',
    data: { alt, credit: 'TKMBS örnek içerik arşivi', license: 'Sunum ve geliştirme kullanımı' },
    filePath: fileURLToPath(new URL(`../../../public${url}`, import.meta.url)),
    overrideAccess: true,
  })
  mediaIdByUrl.set(url, saved.id)
  return saved.id
}

const monuments = await payload.find({ collection: 'monuments', limit: 1000, depth: 0, overrideAccess: true })
for (const item of monuments.docs) {
  const imageMedia = item.imageMedia || await ensureMedia(item.image, item.name)
  const galleryMedia = Array.isArray(item.galleryMedia) && item.galleryMedia.length
    ? item.galleryMedia
    : (await Promise.all((item.gallery || []).map(async (entry, index) => {
      const media = await ensureMedia(entry.url, `${item.name} - ${index + 1}`)
      return media ? { media } : null
    }))).filter(Boolean)
  if (imageMedia || galleryMedia.length) {
    await payload.update({ collection: 'monuments', id: item.id, data: { imageMedia, galleryMedia } as never, draft: false, overrideAccess: true })
  }
}

const routes = await payload.find({ collection: 'cultural-routes', limit: 1000, depth: 0, overrideAccess: true })
for (const item of routes.docs) {
  if (!item.imageMedia) {
    const imageMedia = await ensureMedia(item.image, item.title)
    if (imageMedia) await payload.update({ collection: 'cultural-routes', id: item.id, data: { imageMedia } as never, draft: false, overrideAccess: true })
  }
}

const events = await payload.find({ collection: 'events', limit: 1000, depth: 0, overrideAccess: true })
for (const item of events.docs) {
  if (!item.imageMedia) {
    const imageMedia = await ensureMedia(item.image, item.title)
    if (imageMedia) await payload.update({ collection: 'events', id: item.id, data: { imageMedia } as never, draft: false, overrideAccess: true })
  }
}

console.log(`Medya taşıması tamamlandı: ${mediaIdByUrl.size} yerel görsel işlendi.`)
await payload.destroy()
