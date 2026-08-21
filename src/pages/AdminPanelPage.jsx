import React from 'react';
import './AdminPanelPage.css';

const AdminPanelPage = () => {
  return (
    <div className="admin-panel-page">
      <div className="admin-header">
        <h1>Yönetim Paneli</h1>
        <p>Sistem istatistiklerini görüntüleyin, içerikleri yönetin ve performansı takip edin.</p>
      </div>

      <div className="admin-stats-row">
        <div className="stat-card">
          <span className="stat-label">Toplam Eser</span>
          <span className="stat-value">256</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Toplam Rota</span>
          <span className="stat-value">6</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Yaklaşan Etkinlik</span>
          <span className="stat-value">14</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Saha Noktası</span>
          <span className="stat-value">152</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Kullanıcı</span>
          <span className="stat-value">1.248</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Aktif Saha Ekibi</span>
          <span className="stat-value">24</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Proje Durumu</span>
          <span className="stat-value">Açık: 12</span>
        </div>
      </div>

      <div className="admin-main-grid">
        {/* Column 1 */}
        <div className="admin-col">
          <div className="admin-card">
            <h3>Ziyaretçi İstatistikleri</h3>
            <div className="placeholder-chart">
              <span>(Grafik Alanı)</span>
            </div>
          </div>
          <div className="admin-card">
            <h3>Onay Bekleyen İçerikler</h3>
            <ul className="pending-list">
              <li>
                <div className="pending-info">
                  <span className="pending-title">Kaleiçi Surları Güncelleme</span>
                  <span className="pending-author">Ahmet Y.</span>
                </div>
                <div className="pending-actions">
                  <button className="btn-accept">✓</button>
                  <button className="btn-reject">✗</button>
                </div>
              </li>
              <li>
                <div className="pending-info">
                  <span className="pending-title">Yeni Rota: Tarihi Çarşılar</span>
                  <span className="pending-author">Ayşe K.</span>
                </div>
                <div className="pending-actions">
                  <button className="btn-accept">✓</button>
                  <button className="btn-reject">✗</button>
                </div>
              </li>
              <li>
                <div className="pending-info">
                  <span className="pending-title">Etkinlik: Fotoğraf Sergisi</span>
                  <span className="pending-author">Mehmet T.</span>
                </div>
                <div className="pending-actions">
                  <button className="btn-accept">✓</button>
                  <button className="btn-reject">✗</button>
                </div>
              </li>
            </ul>
          </div>
          <div className="admin-card">
            <h3>Son İşlemler</h3>
            <table className="recent-logs-table">
              <tbody>
                <tr>
                  <td>10:45</td>
                  <td>Eser Eklendi: Saat Kulesi</td>
                  <td>Admin</td>
                </tr>
                <tr>
                  <td>09:30</td>
                  <td>Kullanıcı Onayı</td>
                  <td>Moderatör</td>
                </tr>
                <tr>
                  <td>Dün</td>
                  <td>Sistem Yedeği Alındı</td>
                  <td>Sistem</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Column 2 */}
        <div className="admin-col">
          <div className="admin-card">
            <h3>En Çok Görüntülenen İçerik</h3>
            <ol className="top-content-list">
              <li>Eski Şehir Merkezi Rotası (1.2k)</li>
              <li>Tarihi Hamam Restorasyonu (980)</li>
              <li>Büyük Cami Mimarisi (850)</li>
              <li>Müze Gece Turu (720)</li>
              <li>Yerel Lezzetler Festivali (650)</li>
            </ol>
          </div>
          <div className="admin-card">
            <h3>Sistem Durumu</h3>
            <div className="sys-status">
              <div className="status-item healthy">Veritabanı: Sağlıklı</div>
              <div className="status-item warning">Sunucu Yükü: %75</div>
              <div className="status-item healthy">API Servisleri: Aktif</div>
            </div>
          </div>
          <div className="admin-card tall-card">
            <h3>Saha ve İçerik Haritası</h3>
            <div className="placeholder-map">
              <span>(Harita Görünümü)</span>
            </div>
          </div>
        </div>

        {/* Column 3 */}
        <div className="admin-col">
          <div className="admin-card">
            <h3>Yaklaşan Etkinlikler</h3>
            <ul className="events-list">
              <li>
                <span className="event-date">15 Eki</span>
                <span className="event-name">Kültür Mirası Sempozyumu</span>
              </li>
              <li>
                <span className="event-date">20 Eki</span>
                <span className="event-name">Antik Kent Gezisi</span>
              </li>
              <li>
                <span className="event-date">25 Eki</span>
                <span className="event-name">Geleneksel El Sanatları Atölyesi</span>
              </li>
            </ul>
          </div>
          <div className="admin-card">
            <h3>İçerik Yönetimi Hızlı İşlemler</h3>
            <div className="quick-actions-grid">
              <button className="quick-btn">Yeni Eser Ekle</button>
              <button className="quick-btn">Yeni Rota Ekle</button>
              <button className="quick-btn">Etkinlik Oluştur</button>
              <button className="quick-btn">Kullanıcı Yönetimi</button>
              <button className="quick-btn">Saha Görevi Oluştur</button>
              <button className="quick-btn">Duyuru Yayınla</button>
            </div>
          </div>
          <div className="admin-card">
            <h3>Hızlı Raporlar</h3>
            <div className="quick-reports">
              <button className="report-btn">Aylık Ziyaretçi Özeti</button>
              <button className="report-btn">Performans Raporu</button>
              <button className="report-btn">Sistem Logları</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanelPage;
