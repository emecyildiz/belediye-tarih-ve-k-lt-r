import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ApiRequestError } from '../services/authClient';
import { getCmsAdminUrl } from '../services/authClient';
import { IconUser } from '../components/common/Icons';
import './LoginPage.css';

const roleHome = (role) => role === 'admin' || role === 'editor' ? '/yonetim-paneli' : '/profil';

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [fields, setFields] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to={roleHome(user.role)} replace />;

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setFields({});
    try {
      const loggedInUser = await login(form);
      const returnTo = params.get('returnTo');
      const safeReturn = returnTo?.startsWith('/') && !returnTo.startsWith('//') ? returnTo : roleHome(loggedInUser.role);
      if (!returnTo && (loggedInUser.role === 'admin' || loggedInUser.role === 'editor')) {
        window.location.assign(getCmsAdminUrl());
        return;
      }
      navigate(safeReturn, { replace: true });
    } catch (requestError) {
      setError(requestError.message || 'Giriş yapılamadı.');
      if (requestError instanceof ApiRequestError) setFields(requestError.fields || {});
    } finally {
      setSubmitting(false);
    }
  };

  return <div className="login-page">
    <section className="login-intro">
      <span>TKMBS</span>
      <h1>Hatay'ın kültürel mirasına kişisel erişim</h1>
      <p>Favorilerinizi, gezi rotalarınızı ve etkinlik bildirimlerinizi tek hesabınızdan yönetin.</p>
      <ul><li>Kaydettiğiniz eser ve rotalara ulaşın</li><li>Etkinlik hatırlatmalarını takip edin</li><li>Kendi gezi planınızı oluşturun</li></ul>
    </section>
    <section className="login-card">
      <div className="login-card-icon"><IconUser size={27} /></div>
      <span>HESABINIZA GİRİŞ YAPIN</span>
      <h2>Tekrar hoş geldiniz</h2>
      <p>Devam etmek için e-posta adresinizi ve şifrenizi girin.</p>
      <form onSubmit={submit} noValidate>
        <label><span>E-posta adresi</span><input type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} aria-invalid={Boolean(fields.email)} />{fields.email && <small>{fields.email}</small>}</label>
        <label><span>Şifre</span><input type="password" autoComplete="current-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} aria-invalid={Boolean(fields.password)} />{fields.password && <small>{fields.password}</small>}</label>
        {error && <div className="login-error" role="alert">{error}</div>}
        <button type="submit" disabled={submitting}>{submitting ? 'Giriş yapılıyor…' : 'Giriş Yap'}</button>
      </form>
      <small className="login-security-note">Oturumunuz güvenli şekilde yenilenir. Ortak bilgisayarlarda işiniz bitince çıkış yapmayı unutmayın.</small>
    </section>
  </div>;
}
