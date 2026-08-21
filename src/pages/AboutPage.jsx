import TopNavbar from '../components/layout/TopNavbar';
import Footer from '../components/layout/Footer';
import './AboutPage.css';

export default function AboutPage() {
  return (
    <div className="page-layout">
      <TopNavbar />
      <div className="about-page">
        <section className="about-hero">
          <img src="/assets/image3.jpg" alt="HBB" className="about-logo-bg" />
          <div className="about-hero-content">
            <img src="/assets/image6.png" alt="Logo" className="about-logo" />
            <h1>TKMBS</h1>
            <h2>Tarihi ve Kültürel Miras Bilgi Sistemi</h2>
            <p>Hatay Büyükşehir Belediyesi · CBS Şube Müdürlüğü</p>
          </div>
        </section>

        <section className="about-content">
          <div className="about-banner">
            <img src="/assets/image4.png" alt="TKMBS Banner" />
          </div>

          <div className="about-info">
            <h2>Proje Hakkında</h2>
            <p>
              TKMBS (Tarihi ve Kültürel Miras Bilgi Sistemi), Hatay Büyükşehir Belediyesi
              tarafından geliştirilen, şehrin zengin tarihi ve kültürel mirasını dijital
              ortamda sunan kapsamlı bir coğrafi bilgi sistemidir.
            </p>
            <p>
              Sistem; tarihi eserler, kültürel rotalar ve etkinlikleri tek bir platformda
              birleştirir. OpenLayers harita altyapısı ve GeoJSON veri standardı
              kullanılmaktadır.
            </p>

            <div className="about-team">
              <h3>Proje Ekibi</h3>
              <div className="team-grid">
                {[
                  { role: 'Proje Yöneticisi', name: 'CBS Şube Müdürlüğü' },
                  { role: 'Yazılım Geliştirme', name: 'Bilgi İşlem Dairesi' },
                  { role: 'Veri Yönetimi', name: 'Coğrafi Bilgi Sistemleri' },
                  { role: 'Stajyer', name: 'Web Geliştirme Ekibi' },
                ].map((t) => (
                  <div key={t.role} className="team-card">
                    <strong>{t.role}</strong>
                    <span>{t.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="about-tech">
              <h3>Kullanılan Teknolojiler</h3>
              <div className="tech-tags">
                {['React', 'Node.js', 'Express', 'OpenLayers', 'GeoJSON', 'Vite'].map((t) => (
                  <span key={t} className="tech-tag">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
