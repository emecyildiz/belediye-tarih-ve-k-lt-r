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

export function mapRegisterRequestDto(input = {}) {
  const name = normalizeString(input.name).replace(/\s+/g, ' ');
  const email = normalizeString(input.email).toLowerCase();
  const password = typeof input.password === 'string' ? input.password : '';
  const passwordConfirmation = typeof input.passwordConfirmation === 'string' ? input.passwordConfirmation : '';
  const fields = {};

  if (name.length < 2 || name.length > 80) fields.name = 'Ad soyad 2 ile 80 karakter arasında olmalıdır.';
  if (email.length > 254 || !/^\S+@\S+\.\S+$/.test(email)) fields.email = 'Geçerli bir e-posta adresi girin.';
  if (password.length < 10 || !/[a-zçğıöşü]/u.test(password) || !/[A-ZÇĞİÖŞÜ]/u.test(password) || !/\d/.test(password)) {
    fields.password = 'Şifre en az 10 karakter, büyük harf, küçük harf ve rakam içermelidir.';
  }
  if (passwordConfirmation !== password) fields.passwordConfirmation = 'Şifreler birbiriyle eşleşmiyor.';
  if (input.termsAccepted !== true) fields.termsAccepted = 'Devam etmek için kullanım koşullarını kabul edin.';
  if (Object.keys(fields).length) throw new DtoValidationError('Kayıt bilgileri geçersiz.', fields);

  return { name, email, password };
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

export function mapTwoFactorRequestDto(input = {}) {
  const challengeToken = normalizeString(input.challengeToken);
  const rawCode = normalizeString(input.code);
  const code = /^\d[\d\s]*$/.test(rawCode) ? rawCode.replace(/\s/g, '') : rawCode.toUpperCase();
  const fields = {};
  if (!challengeToken) fields.code = 'Doğrulama oturumu bulunamadı. Yeniden giriş yapın.';
  if (!/^\d{6}$/.test(code) && !/^[A-Z2-9]{4}-?[A-Z2-9]{4}$/.test(code)) fields.code = '6 haneli doğrulama veya kurtarma kodunu girin.';
  if (Object.keys(fields).length) throw new DtoValidationError('Doğrulama kodu geçersiz.', fields);
  return { challengeToken, code };
}
