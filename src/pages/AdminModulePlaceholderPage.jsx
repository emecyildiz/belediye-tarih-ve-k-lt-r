import { Link, useParams } from 'react-router-dom';
import './AdminModulePlaceholderPage.css';

const modules = {
  'eser-yonetimi': ['Eser Yönetimi', 'Tarihi eser kayıtlarının eklenmesi, düzenlenmesi ve arşivlenmesi bu modülden yapılacaktır.'],
  'rota-yonetimi': ['Rota Yönetimi', 'Kültürel rota durakları, güzergâhları ve yayın durumları bu modülden yönetilecektir.'],
  'etkinlik-yonetimi': ['Etkinlik Yönetimi', 'Etkinlik takvimi, kontenjan ve yayın işlemleri bu modülden yönetilecektir.'],
  kullanicilar: ['Kullanıcılar', 'Kullanıcı hesapları, roller ve erişim yetkileri bu modülden yönetilecektir.'],
  'icerik-yonetimi': ['İçerik Yönetimi', 'Portalda yayınlanan metin ve görsel içerikler bu modülden yönetilecektir.'],
  bildirimler: ['Bildirimler', 'Yönetim bildirimleri ve duyuru gönderimleri bu modülde yer alacaktır.'],
  yedekleme: ['Yedekleme', 'Veri yedekleme ve geri yükleme işlemleri bu modülden takip edilecektir.'],
};

export default function AdminModulePlaceholderPage() {
  const { module } = useParams();
  const [title, description] = modules[module] || ['Yönetim Modülü', 'Bu yönetim modülü henüz kullanıma açılmadı.'];

  return (
    <section className="admin-module-page">
      <header className="admin-module-header">
        <div>
          <span>YÖNETİM PANELİ</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <Link to="/yonetim-paneli">Gösterge Paneline Dön</Link>
      </header>

      <div className="admin-module-placeholder">
        <div className="admin-module-placeholder-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1M7.7 16.3l-2.1 2.1"/><circle cx="12" cy="12" r="4"/></svg>
        </div>
        <span>GELİŞTİRME AŞAMASINDA</span>
        <h2>Bu sayfa şu anda hazırlanıyor</h2>
        <p>Modül, belediyenin gerçek veri ve yetkilendirme altyapısı bağlandıktan sonra kullanıma açılacaktır.</p>
        <div className="admin-module-note">
          <strong>Ana yönetim ekranı kullanıma hazırdır.</strong>
          <small>Güncel sistem özetlerini ve raporları Gösterge Paneli üzerinden inceleyebilirsiniz.</small>
        </div>
      </div>
    </section>
  );
}
