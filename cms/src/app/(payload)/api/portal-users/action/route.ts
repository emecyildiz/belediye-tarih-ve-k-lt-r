import config from '@payload-config'
import { randomUUID } from 'node:crypto'
import { getPayload } from 'payload'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(request: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user || user.collection !== 'users' || user.role !== 'admin') return Response.json({ error: 'Yetkisiz işlem.' }, { status: 403 })

  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (origin && new URL(origin).host !== host) return Response.json({ error: 'Geçersiz istek kaynağı.' }, { status: 403 })

  const form = await request.formData()
  const userId = String(form.get('userId') || '')
  const action = String(form.get('action') || '')
  const requestedReturnTo = String(form.get('returnTo') || '')
  const returnTo = requestedReturnTo.startsWith('/admin/portal-kullanicilari') && !requestedReturnTo.startsWith('//')
    ? requestedReturnTo
    : '/admin/portal-kullanicilari'
  if (!uuidPattern.test(userId) || !['reset-two-factor', 'toggle-active'].includes(action)) return Response.json({ error: 'İşlem bilgileri geçersiz.' }, { status: 400 })

  const client = await payload.db.pool.connect()
  try {
    await client.query('BEGIN')
    const selected = await client.query('SELECT id, email, active, two_factor_enabled FROM tkmbs_portal_users WHERE id = $1 FOR UPDATE', [userId])
    const target = selected.rows[0]
    if (!target) { await client.query('ROLLBACK'); return Response.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 }) }

    let notice = 'status'
    if (action === 'reset-two-factor') {
      await client.query(`UPDATE tkmbs_portal_users SET two_factor_enabled = false, two_factor_secret = NULL, two_factor_pending_secret = NULL, two_factor_last_used_step = NULL, two_factor_recovery_codes = '[]'::jsonb, two_factor_failed_attempts = 0, two_factor_locked_until = NULL WHERE id = $1`, [userId])
      notice = 'reset'
    } else {
      if (target.email.toLowerCase() === user.email.toLowerCase()) { await client.query('ROLLBACK'); return Response.json({ error: 'Kendi hesabınızı pasif yapamazsınız.' }, { status: 400 }) }
      await client.query('UPDATE tkmbs_portal_users SET active = NOT active WHERE id = $1', [userId])
    }

    await client.query('UPDATE tkmbs_auth_refresh_sessions SET revoked_at = COALESCE(revoked_at, now()) WHERE user_id = $1', [userId])
    await client.query('DELETE FROM users_sessions WHERE _parent_id IN (SELECT id FROM users WHERE lower(email) = lower($1))', [target.email])
    await client.query(`INSERT INTO tkmbs_security_audit (id, user_id, email, event_type, success, metadata) VALUES ($1, $2, $3, $4, true, $5::jsonb)`, [randomUUID(), userId, target.email, action === 'reset-two-factor' ? 'admin_two_factor_reset' : 'admin_account_status_changed', JSON.stringify({ performedBy: user.email })])
    await client.query('COMMIT')
    const redirectUrl = new URL(returnTo, request.url)
    redirectUrl.searchParams.set('notice', notice)
    return Response.redirect(redirectUrl, 303)
  } catch (error) {
    await client.query('ROLLBACK')
    payload.logger.error({ err: error }, 'Portal kullanıcı işlemi başarısız')
    return Response.json({ error: 'Kullanıcı işlemi tamamlanamadı.' }, { status: 500 })
  } finally {
    client.release()
  }
}
