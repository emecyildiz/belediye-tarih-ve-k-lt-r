import { SocialIcons } from '../common/Icons';

export default function Footer({ variant = 'default' }) {
  return (
    <footer className={`site-footer ${variant}`}>
      <div className="footer-inner">
        <div className="footer-brand">
          <img src="/assets/image6.png" alt="HBB" />
          <div>
            <strong>Hatay Büyükşehir Belediyesi</strong>
            <p>© 2026 TKMBS - Tarihi ve Kültürel Miras Bilgi Sistemi</p>
          </div>
        </div>

        <div className="footer-columns">
          <div className="footer-col">
            <a href="#">Başkan</a>
            <a href="#">Meclis</a>
            <a href="#">Kurullar</a>
          </div>
          <div className="footer-col">
            <a href="#">E-Belediye</a>
            <a href="#">Projeler</a>
            <a href="#">Yayınlar</a>
          </div>
          <div className="footer-col">
            <p>0326 XXX XX XX</p>
            <p>info@hatay.bel.tr</p>
            <p>Antakya / Hatay</p>
          </div>
          <div className="footer-col">
            <a href="#">Gizlilik Politikası</a>
            <a href="#">KVKK</a>
            <a href="#">Sıkça Sorulan Sorular</a>
          </div>
        </div>

        <div className="footer-social">
          <span>Bizi Takip Edin</span>
          <SocialIcons />
        </div>
      </div>
    </footer>
  );
}
