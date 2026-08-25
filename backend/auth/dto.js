import { AUTHORIZED_ROLES } from './config.js';

export class DtoValidationError extends Error {
  constructor(message, fields = {}) {
    super(message);
    this.name = 'DtoValidationError';
    this.fields = fields;
  }
}

const normalizeString = (value) => typeof value === 'string' ? value.trim() : '';

export function mapLoginRequestDto(input = {}) {
  const email = normalizeString(input.email).toLowerCase();
  const password = typeof input.password === 'string' ? input.password : '';
  const fields = {};
  if (!/^\S+@\S+\.\S+$/.test(email)) fields.email = 'Geçerli bir e-posta adresi girin.';
  if (password.length < 8) fields.password = 'Şifre en az 8 karakter olmalıdır.';
  if (Object.keys(fields).length) throw new DtoValidationError('Giriş bilgileri geçersiz.', fields);
  return { email, password };
}

export function mapAuthUserDto(user = {}) {
  return {
    id: String(user.id),
    name: normalizeString(user.name),
    email: normalizeString(user.email),
    role: AUTHORIZED_ROLES.includes(user.role) ? user.role : 'citizen',
  };
}

export function mapAuthResponseDto({ accessToken, expiresIn, user }) {
  return {
    accessToken,
    tokenType: 'Bearer',
    expiresIn,
    user: mapAuthUserDto(user),
  };
}
