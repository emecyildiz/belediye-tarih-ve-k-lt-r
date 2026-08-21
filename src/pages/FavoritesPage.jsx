import React from 'react';
import './FavoritesPage.css';

const FavoritesPage = () => {
  return (
    <div className="favorites-page">
      <header className="fp-header">
        <h1>Profil & Favoriler</h1>
        <p>Favorilerinizi görüntüleyin, profil bilgilerinizi yönetin ve geçmiş aktivitelerinizi inceleyin.</p>
      </header>

      <div className="fp-tabs">
        <button className="fp-tab active">Favorilerim</button>
        <button className="fp-tab">Profil Bilgilerim</button>
        <button className="fp-tab">Geçmişim</button>
        <button className="fp-tab">Ayarlar</button>
      </div>

      <div className="fp-content">
        <div className="fp-left">
          {/* Favori Eserlerim */}
          <section>
            <div className="fp-section-header">
              <h2>Favori Eserlerim</h2>
              <a href="#tumunu-gor">Tümünü Gör &gt;</a>
            </div>
            <div className="fp-grid">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="fp-card">
                  <div className="fp-card-img">
                    <img src={`https://picsum.photos/400/200?random=${item}`} alt="Eser" />
                    <div className="fp-card-icons">
                      <button className="fp-icon-btn">🔖</button>
                      <button className="fp-icon-btn heart">❤️</button>
                    </div>
                  </div>
                  <div className="fp-card-body">
                    <h3 className="fp-card-title">Tarihi Eser {item}</h3>
                    <div className="fp-card-loc">📍 Merkez, Şehir</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Favori Rotalarım */}
          <section>
            <div className="fp-section-header">
              <h2>Favori Rotalarım</h2>
              <a href="#tumunu-gor">Tümünü Gör &gt;</a>
            </div>
            <div className="fp-grid">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="fp-card">
                  <div className="fp-card-img">
                    <img src={`https://picsum.photos/400/200?random=${item + 10}`} alt="Rota" />
                    <div className="fp-card-icons">
                      <button className="fp-icon-btn heart">❤️</button>
                    </div>
                  </div>
                  <div className="fp-card-body">
                    <h3 className="fp-card-title">Kültür Rotası {item}</h3>
                    <div className="fp-card-loc">📍 Tarihi Yarımada</div>
                    <div className="fp-card-meta">
                      <span>⏱️ 2 Saat</span>
                      <span>📏 4.5 km</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Bottom Row */}
          <div className="fp-bottom-row">
            <section>
              <div className="fp-section-header">
                <h2>Bekleyen Etkinliklerim</h2>
              </div>
              <div className="fp-list">
                <div className="fp-event-item">
                  <div className="fp-event-date">
                    <span>15</span>
                    <span>Eyl</span>
                  </div>
                  <div className="fp-event-info">
                    <div className="fp-event-title">Klasik Müzik Dinletisi</div>
                    <div className="fp-event-meta">📍 Açık Hava Sahnesi • 🕒 20:00</div>
                  </div>
                </div>
                <div className="fp-event-item">
                  <div className="fp-event-date">
                    <span>22</span>
                    <span>Eyl</span>
                  </div>
                  <div className="fp-event-info">
                    <div className="fp-event-title">Tarih Sohbetleri</div>
                    <div className="fp-event-meta">📍 Şehir Kütüphanesi • 🕒 14:00</div>
                  </div>
                </div>
              </div>
            </section>
            
            <section>
              <div className="fp-section-header">
                <h2>Son Görüntülediklerim</h2>
              </div>
              <div className="fp-list">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="fp-recent-item">
                    <img src={`https://picsum.photos/100/100?random=${item + 20}`} alt="Recent" className="fp-recent-img" />
                    <div className="fp-recent-info">
                      <h4>Görüntülenen Öğe {item}</h4>
                      <div className="fp-recent-meta">📍 Konum {item} • 📅 2 gün önce</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="fp-right">
          <div className="fp-stats-row">
            <div className="fp-stat-box">
              <div className="fp-stat-num">27</div>
              <div className="fp-stat-label">Toplam Favori</div>
            </div>
            <div className="fp-stat-box">
              <div className="fp-stat-num">21</div>
              <div className="fp-stat-label">Geçmiş Ziyaret</div>
            </div>
          </div>

          <div className="fp-widget">
            <h3>Genişletilmiş Ziyaret İstatistikleri</h3>
            <div className="fp-chart-placeholder">
              <div className="fp-bar" style={{ height: '40%' }}></div>
              <div className="fp-bar" style={{ height: '60%' }}></div>
              <div className="fp-bar" style={{ height: '80%' }}></div>
              <div className="fp-bar" style={{ height: '30%' }}></div>
              <div className="fp-bar" style={{ height: '90%' }}></div>
              <div className="fp-bar" style={{ height: '50%' }}></div>
            </div>
          </div>

          <div className="fp-widget">
            <h3>Saha Gözlem & Hasar Takibi</h3>
            <div className="fp-map-placeholder">
              [Harita Alanı]
            </div>
            <div className="fp-legend">
              <div className="fp-legend-item">
                <span className="fp-dot green"></span>
                <span>İyi Durumda (15)</span>
              </div>
              <div className="fp-legend-item">
                <span className="fp-dot yellow"></span>
                <span>Bakım Gerektirir (4)</span>
              </div>
              <div className="fp-legend-item">
                <span className="fp-dot red"></span>
                <span>Hasarlı / Acil (2)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FavoritesPage;
