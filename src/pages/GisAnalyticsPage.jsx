import TopNavbar from '../components/layout/TopNavbar';
import Footer from '../components/layout/Footer';
import './GisAnalyticsPage.css';

export default function GisAnalyticsPage() {
  return (
    <div className="page-layout">
      <TopNavbar />
      <div className="gis-content">
        <h1>CBS Analitik Raporlama</h1>
        <p>Coğrafi Bilgi Sistemi tabanlı mekansal analizler ve raporlamalar.</p>
        <div className="gis-dashboard">
          <div className="gis-card">
            <h3>Yoğunluk Analizi</h3>
            <div className="gis-placeholder">Harita ve Yoğunluk Grafiği Yüklenecek</div>
          </div>
          <div className="gis-card">
            <h3>Dağılım Analizi</h3>
            <div className="gis-placeholder">Bölgelere Göre Dağılım Yüklenecek</div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
