import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { ApiRequestError } from '../services/authClient';
import { IconUser } from '../components/common/Icons';
import './LoginPage.css';
import { publicAsset } from '../config/runtime';

const initialForm = {
  name: '',
  email: '',
  password: '',
  passwordConfirmation: '',
  termsAccepted: false,
};

export default function RegisterPage() {
  const { user, loading, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [fields, setFields] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/profil" replace />;

  const updateField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setFields((current) => ({ ...current, [name]: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setFields({});
    try {
      await register(form);
      navigate('/profil', { replace: true });
    } catch (requestError) {
      setError(requestError.message || 'Hesap oluşturulamadı.');
      if (requestError instanceof ApiRequestError) setFields(requestError.fields || {});
    } finally {
      setSubmitting(false);
    }
  };

  return <div className="login-page register-page" style={{ '--login-brand-image': `url("${publicAsset('assets/image6.png')}")` }}>
    <section className="login-intro register-intro">
      <span>TKMBS</span>
      <h1>Hatay'ı kendi rotanızla keşfedin</h1>
      <p>Ücretsiz hesabınızı oluşturun; sevdiğiniz eserleri, kültürel rotaları ve etkinlikleri tek yerde saklayın.</p>
      <ul><li>Favorilerinize her cihazdan ulaşın</li><li>Kendi gezi rotalarınızı kaydedin</li><li>Yaklaşan etkinlikleri takip edin</li></ul>
    </section>
    <section className="login-card register-card">
      <div className="login-card-icon"><IconUser size={27} /></div>
      <span>YENİ HESAP OLUŞTURUN</span>
      <h2>Aramıza katılın</h2>
      <p>Kişisel kültür mirası hesabınızı birkaç adımda oluşturun.</p>
      <form onSubmit={submit} noValidate>
        <label><span>Ad Soyad</span><input type="text" autoComplete="name" maxLength="80" value={form.name} onChange={(event) => updateField('name', event.target.value)} aria-invalid={Boolean(fields.name)} />{fields.name && <small>{fields.name}</small>}</label>
        <label><span>E-posta adresi</span><input type="email" autoComplete="email" maxLength="254" value={form.email} onChange={(event) => updateField('email', event.target.value)} aria-invalid={Boolean(fields.email)} />{fields.email && <small>{fields.email}</small>}</label>
        <div className="register-password-grid">
          <label><span>Şifre</span><input type="password" autoComplete="new-password" value={form.password} onChange={(event) => updateField('password', event.target.value)} aria-invalid={Boolean(fields.password)} />{fields.password && <small>{fields.password}</small>}</label>
          <label><span>Şifre Tekrarı</span><input type="password" autoComplete="new-password" value={form.passwordConfirmation} onChange={(event) => updateField('passwordConfirmation', event.target.value)} aria-invalid={Boolean(fields.passwordConfirmation)} />{fields.passwordConfirmation && <small>{fields.passwordConfirmation}</small>}</label>
        </div>
        <small className="register-password-hint">En az 10 karakter; büyük harf, küçük harf ve rakam kullanın.</small>
        <label className="register-terms">
          <input type="checkbox" checked={form.termsAccepted} onChange={(event) => updateField('termsAccepted', event.target.checked)} />
          <span>Kullanım koşullarını ve kişisel verilerin hesap hizmetleri için işlenmesini kabul ediyorum.</span>
        </label>
        {fields.termsAccepted && <small className="register-field-error">{fields.termsAccepted}</small>}
        {error && <div className="login-error" role="alert">{error}</div>}
        <button type="submit" disabled={submitting}>{submitting ? 'Hesap oluşturuluyor…' : 'Hesap Oluştur'}</button>
      </form>
      <p className="login-register-prompt">Zaten hesabınız var mı? <Link to="/giris">Giriş Yap</Link></p>
      <small className="login-security-note">Hesabınız yalnızca halk portalında oluşturulur; yönetim paneli yetkisi vermez.</small>
    </section>
  </div>;
}
