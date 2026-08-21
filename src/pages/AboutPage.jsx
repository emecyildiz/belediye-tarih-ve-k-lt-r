import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  IconArrow, IconCalendar, IconDocument, IconInfo, IconMap,
  IconMonument, IconPin, IconRoute,
} from '../components/common/Icons';
import './AboutPage.css';

const capabilities = [
  {
    icon: IconMonument,
    title: 'Dijital kültür envanteri',
    text: 'Tarihi eserlerin dönem, konum, koruma ve ziyaret bilgilerinin ortak bir yapıda sunulması.',
  },
  {
    icon: IconMap,
    title: 'CBS tabanlı keşif',
    text: 'Konumsal verilerin OpenLayers haritasında katmanlar ve filtrelerle görüntülenmesi.',
  },
  {
    icon: IconRoute,
    title: 'Kültürel rotalar',
    text: 'Tematik durakların mesafe, süre ve ulaşım bilgileriyle gezi planına dönüştürülmesi.',
  },
  {
    icon: IconCalendar,
    title: 'Etkinlik takvimi',
    text: 'Kentteki kültür, sanat, gezi ve atölye programlarının tek takvimde takip edilmesi.',
  },
];

const processSteps = [
  ['01', 'Kayıt', 'Kültür varlığına ait temel ve konumsal bilgiler sisteme kaydedilir.'],
  ['02', 'Doğrulama', 'İçerik, koordinat ve medya bilgileri yetkili birimlerce kontrol edilir.'],
  ['03', 'Yayın', 'Onaylanan kayıtlar harita ve ilgili katalog sayfalarında yayımlanır.'],
  ['04', 'Analiz', 'Ziyaret ve kullanım verileri yönetici raporlarına tutarlı biçimde aktarılır.'],
];

const technologies = [
  ['React', 'Kullanıcı arayüzü'],
  ['Node.js & Express', 'API ve servis katmanı'],
  ['OpenLayers', 'Web haritası'],
  ['GeoJSON', 'Konumsal veri aktarımı'],
];

export default function AboutPage() {
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    let active = true;
    api.getStatistics()
      .then((data) => active && setStatistics(data))
      .catch((error) => console.error('Hakkında sayfası istatistikleri yüklenemedi:', error));
    return () => { active = false; };
  }, []);

  const summary = [
    { label: 'Kayıtlı eser', value: statistics?.toplamEser, icon: IconMonument },
    { label: 'Kültürel rota', value: statistics?.kulturRota, icon: IconRoute },
    { label: 'Etkinlik', value: statistics?.etkinlik, icon: IconCalendar },
    { label: 'Harita konumu', value: statistics?.harita?.toplamEser, icon: IconPin },
  ];

  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="about-hero-copy">
          <span className="about-eyebrow"><IconInfo size={14} /> Kurumsal proje</span>
          <h1>Hatay'ın kültürel belleği<br /><em>dijital haritada.</em></h1>
          <p>
            TKMBS; Hatay'ın tarihi eserlerini, kültürel rotalarını ve etkinliklerini
            erişilebilir, güncel ve konum tabanlı bir bilgi sistemi içinde buluşturur.
          </p>
          <div className="about-hero-actions">
            <Link className="about-primary-action" to="/harita">Haritayı keşfet <IconArrow size={15} /></Link>
            <Link className="about-secondary-action" to="/tarihi-eserler">Eserleri incele</Link>
          </div>
        </div>

        <div className="about-identity-card">
          <div className="about-identity-brand">
            <img src="/assets/image6.png" alt="Hatay Büyükşehir Belediyesi" />
          </div>
          <div className="about-identity-title">
            <small>TKMBS</small>
            <strong>Tarihi ve Kültürel<br />Miras Bilgi Sistemi</strong>
            <span>Hatay Büyükşehir Belediyesi</span>
          </div>
          <div className="about-identity-grid" aria-hidden="true">
            <i /><i /><i /><i /><i /><i /><i /><i /><i />
          </div>
        </div>
      </section>

      <section className="about-summary" aria-label="Sistem özeti">
        {summary.map(({ label, value, icon: Icon }) => (
          <article key={label}>
            <span><Icon size={19} /></span>
            <div><strong>{value ?? '—'}</strong><small>{label}</small></div>
          </article>
        ))}
      </section>

      <section className="about-intro">
        <div className="about-section-heading">
          <span>PROJE HAKKINDA</span>
          <h2>Kültürel mirasa tek noktadan erişim</h2>
        </div>
        <div className="about-intro-copy">
          <p>
            Tarihi ve Kültürel Miras Bilgi Sistemi; kentin farklı kaynaklarda bulunan
            kültür envanterini ortak bir veri yapısında birleştirmek, harita üzerinde
            görünür kılmak ve vatandaşların doğru bilgiye kolayca ulaşmasını sağlamak
            amacıyla tasarlanmıştır.
          </p>
          <p>
            Sistem yalnızca bir tanıtım sitesi değildir. Eser, rota ve etkinlik kayıtları
            aynı veri kaynağına bağlı çalışır; bu veriler yönetim tarafındaki istatistik ve
            raporların da temelini oluşturur.
          </p>
        </div>
      </section>

      <section className="about-capabilities">
        <div className="about-section-heading centered">
          <span>SİSTEM NELER SUNAR?</span>
          <h2>Keşiften planlamaya bütünleşik deneyim</h2>
        </div>
        <div className="about-capability-grid">
          {capabilities.map(({ icon: Icon, title, text }) => (
            <article key={title}>
              <span><Icon size={22} /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-data-flow">
        <div className="about-flow-copy">
          <span>VERİ YAŞAM DÖNGÜSÜ</span>
          <h2>Bir kayıt, sistemin tamamında aynı bilgi</h2>
          <p>
            Ana kayıtlarda yapılan değişiklikler ilgili katalog, harita ve rapor ekranlarına
            aynı veri ilişkileri üzerinden yansır. Böylece birbirinden kopuk veya çelişen
            içeriklerin oluşması önlenir.
          </p>
          <div className="about-data-note">
            <IconDocument size={19} />
            <div><strong>Kurumsal CBS entegrasyonuna hazır</strong><small>Servis katmanı, belediyenin API ve gerçek CBS veri altyapısına bağlanabilecek şekilde ayrıştırılmıştır.</small></div>
          </div>
        </div>
        <ol className="about-process-list">
          {processSteps.map(([number, title, text]) => (
            <li key={number}><b>{number}</b><div><strong>{title}</strong><p>{text}</p></div></li>
          ))}
        </ol>
      </section>

      <section className="about-technology">
        <div className="about-section-heading">
          <span>TEKNİK ALTYAPI</span>
          <h2>Açık standartlarla geliştirildi</h2>
          <p>Modüler servis yapısı sayesinde veri kaynağı değiştiğinde kullanıcı arayüzü aynı sözleşmeyle çalışmayı sürdürebilir.</p>
        </div>
        <div className="about-tech-list">
          {technologies.map(([name, purpose]) => <article key={name}><strong>{name}</strong><span>{purpose}</span></article>)}
        </div>
      </section>

      <section className="about-closing">
        <div><span>HATAY'I KEŞFET</span><h2>Tarihimizi korumak,<br />geleceğimize aktarmak.</h2></div>
        <Link to="/kultur-rotalari">Kültürel rotalara göz at <IconArrow size={16} /></Link>
      </section>
    </div>
  );
}
