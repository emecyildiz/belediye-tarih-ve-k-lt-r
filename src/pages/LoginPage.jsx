import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { ApiRequestError } from '../services/authClient';
import { getCmsAdminUrl } from '../services/authClient';
import { IconUser } from '../components/common/Icons';
import './LoginPage.css';
import { publicAsset } from '../config/runtime';

const isContentManager = (role) => role === 'admin' || role === 'editor';

export default function LoginPage() {
  const { user, loading, login, verifyTwoFactor } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [fields, setFields] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [twoFactor, setTwoFactor] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState([]);

  useEffect(() => {
    if (!loading && user && isContentManager(user.role)) {
      window.location.replace(getCmsAdminUrl());
    }
  }, [loading, user]);

  if (!loading && user) {
    if (isContentManager(user.role)) return <div className="auth-route-loading">İçerik yönetimine yönlendiriliyorsunuz…</div>;
    return <Navigate to="/profil" replace />;
  }

  const continueAfterLogin = (loggedInUser) => {
    if (isContentManager(loggedInUser.role)) {
      window.location.replace(getCmsAdminUrl());
      return;
    }
    const returnTo = params.get('returnTo');
    const safeReturn = returnTo?.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/profil';
    navigate(safeReturn, { replace: true });
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setFields({});
    try {
      const result = await login(form);
      if (result.twoFactorRequired) {
        setTwoFactor(result);
        setVerificationCode('');
        return;
      }
      continueAfterLogin(result.user);
    } catch (requestError) {
      setError(requestError.message || 'Giriş yapılamadı.');
      if (requestError instanceof ApiRequestError) setFields(requestError.fields || {});
    } finally {
      setSubmitting(false);
    }
  };

  const submitTwoFactor = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setFields({});
    try {
      const result = await verifyTwoFactor({
        challengeToken: twoFactor.challengeToken,
        code: verificationCode,
        credentials: form,
      });
      if (result.recoveryCodes?.length) {
        setRecoveryCodes(result.recoveryCodes);
        return;
      }
      continueAfterLogin(result.user);
    } catch (requestError) {
      setError(requestError.message || 'Doğrulama tamamlanamadı.');
      if (requestError instanceof ApiRequestError) setFields(requestError.fields || {});
    } finally {
      setSubmitting(false);
    }
  };

  return <div className="login-page" style={{ '--login-brand-image': `url("${publicAsset('assets/image6.png')}")` }}>
    <section className="login-intro">
      <span>TKMBS</span>
      <h1>Hatay'ın kültürel mirasına kişisel erişim</h1>
      <p>Favorilerinizi, gezi rotalarınızı ve etkinlik bildirimlerinizi tek hesabınızdan yönetin.</p>
      <ul><li>Kaydettiğiniz eser ve rotalara ulaşın</li><li>Etkinlik hatırlatmalarını takip edin</li><li>Kendi gezi planınızı oluşturun</li></ul>
    </section>
    <section className="login-card">
      <div className="login-card-icon"><IconUser size={27} /></div>
      {recoveryCodes.length ? <>
        <span>GÜVENLİK KURULUMU TAMAMLANDI</span>
        <h2>Kurtarma kodlarınızı saklayın</h2>
        <p>Telefonunuza erişemediğinizde bu kodlardan birini kullanabilirsiniz. Her kod yalnızca bir kez çalışır ve daha sonra tekrar gösterilmez.</p>
        <div className="recovery-code-list">{recoveryCodes.map((code) => <code key={code}>{code}</code>)}</div>
        <button type="button" className="recovery-continue-button" onClick={() => continueAfterLogin(twoFactor.user)}>Kodları Sakladım, Payload’a Devam Et</button>
      </> : !twoFactor ? <>
        <span>HESABINIZA GİRİŞ YAPIN</span>
        <h2>Tekrar hoş geldiniz</h2>
        <p>Devam etmek için e-posta adresinizi ve şifrenizi girin.</p>
        <form onSubmit={submit} noValidate>
          <label><span>E-posta adresi</span><input type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} aria-invalid={Boolean(fields.email)} />{fields.email && <small>{fields.email}</small>}</label>
          <label><span>Şifre</span><input type="password" autoComplete="current-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} aria-invalid={Boolean(fields.password)} />{fields.password && <small>{fields.password}</small>}</label>
          {error && <div className="login-error" role="alert">{error}</div>}
          <button type="submit" disabled={submitting}>{submitting ? 'Giriş yapılıyor…' : 'Giriş Yap'}</button>
        </form>
        <p className="login-register-prompt">Henüz hesabınız yok mu? <Link to="/kayit-ol">Kayıt Ol</Link></p>
        <small className="login-security-note">Oturumunuz güvenli şekilde yenilenir. Ortak bilgisayarlarda işiniz bitince çıkış yapmayı unutmayın.</small>
      </> : <>
        <span>İKİ ADIMLI DOĞRULAMA</span>
        <h2>{twoFactor.setupRequired ? 'Google Authenticator’ı kurun' : 'Doğrulama kodunu girin'}</h2>
        <p>{twoFactor.setupRequired ? 'Telefonunuzdaki Google Authenticator uygulamasıyla QR kodu tarayın ve oluşan 6 haneli kodu girin.' : 'Google Authenticator uygulamasında görünen 6 haneli güncel kodu girin.'}</p>
        {twoFactor.setupRequired && <div className="two-factor-setup">
          <img src={twoFactor.setup.qrCodeDataUrl} alt="Google Authenticator kurulum QR kodu" />
          <div><small>QR kodu tarayamıyorsanız kurulum anahtarı:</small><strong>{twoFactor.setup.manualKey}</strong></div>
        </div>}
        <form onSubmit={submitTwoFactor} noValidate>
          <label><span>{recoveryMode ? 'Tek kullanımlık kurtarma kodu' : '6 haneli doğrulama kodu'}</span><input className="two-factor-code" type="text" inputMode={recoveryMode ? 'text' : 'numeric'} autoComplete="one-time-code" maxLength={recoveryMode ? 9 : 6} value={verificationCode} onChange={(event) => setVerificationCode(recoveryMode ? event.target.value.toUpperCase().replace(/[^A-Z2-9-]/g, '').slice(0, 9) : event.target.value.replace(/\D/g, '').slice(0, 6))} aria-invalid={Boolean(fields.code)} autoFocus />{fields.code && <small>{fields.code}</small>}</label>
          {error && <div className="login-error" role="alert">{error}</div>}
          <button type="submit" disabled={submitting || (recoveryMode ? verificationCode.replace('-', '').length !== 8 : verificationCode.length !== 6)}>{submitting ? 'Doğrulanıyor…' : twoFactor.setupRequired ? 'Kurulumu Tamamla' : 'Doğrula ve Giriş Yap'}</button>
          {!twoFactor.setupRequired && <button type="button" className="login-text-button" onClick={() => { setRecoveryMode((value) => !value); setVerificationCode(''); setError(''); }}>{recoveryMode ? 'Authenticator kodu kullan' : 'Kurtarma kodu kullan'}</button>}
          <button type="button" className="login-secondary-button" onClick={() => { setTwoFactor(null); setError(''); setVerificationCode(''); setRecoveryMode(false); }}>Giriş bilgilerine dön</button>
        </form>
      </>}
    </section>
  </div>;
}
