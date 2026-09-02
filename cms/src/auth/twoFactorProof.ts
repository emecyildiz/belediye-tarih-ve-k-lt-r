import { createHmac, timingSafeEqual } from 'node:crypto'

const LOCAL_TWO_FACTOR_SECRET = 'tkmbs-local-two-factor-secret-change-before-production'
const proofSecret = () => process.env.TWO_FACTOR_SECRET
  || (process.env.NODE_ENV === 'production' ? '' : LOCAL_TWO_FACTOR_SECRET)

type ProofPayload = {
  type?: string
  email?: string
  role?: string
  iss?: string
  exp?: number
}

export function verifyCmsTwoFactorProof(token: string | null, expectedEmail: string, expectedRole: string): boolean {
  try {
    const [encoded, signature, extra] = String(token || '').split('.')
    if (!encoded || !signature || extra || !proofSecret()) return false
    const actual = Buffer.from(signature, 'base64url')
    const expected = createHmac('sha256', proofSecret()).update(encoded).digest()
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as ProofPayload
    return payload.type === 'cms-two-factor-proof'
      && payload.iss === 'tkmbs-api'
      && payload.email?.toLowerCase() === expectedEmail.toLowerCase()
      && payload.role === expectedRole
      && Number.isInteger(payload.exp)
      && Number(payload.exp) > Math.floor(Date.now() / 1000)
  } catch {
    return false
  }
}
