import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  IconArrow, IconCalendar, IconInfo, IconMap,
  IconMonument, IconPin, IconRoute,
} from '../components/common/Icons';
import './AboutPage.css';

const capabilities = [
  {
    icon: IconMonument,
    title: 'Tarihi yerleri tanıyın',
    text: 'Hatay’ın camilerini, kiliselerini, müzelerini, kalelerini ve doğal güzelliklerini yakından tanıyın.',
  },
  {
    icon: IconMap,
    title: 'Haritada kolayca bulun',
    text: 'Ziyaret etmek istediğiniz yerlerin konumunu görün ve çevrenizdeki kültürel durakları keşfedin.',
  },
  {
    icon: IconRoute,
    title: 'Gezinizi planlayın',
    text: 'Hazırlanan kültürel rotalarla gezi sürenizi, duraklarınızı ve ziyaret sıranızı önceden planlayın.',
  },
  {
    icon: IconCalendar,
    title: 'Etkinliklere katılın',
    text: 'Kültür, sanat, gezi ve atölye programlarını takvimden izleyerek Hatay’ın kültürel yaşamına katılın.',
  },
];

const processSteps = [
  ['01', 'Keşfet', 'İlginizi çeken tarihi eserleri, doğal alanları ve kültürel etkinlikleri bulun.'],
  ['02', 'Bilgi edin', 'Ziyaret öncesinde yapının tarihini, özelliklerini, konumunu ve ziyaret bilgilerini öğrenin.'],
  ['03', 'Planla', 'Kültürel rotaları inceleyin veya görmek istediğiniz duraklarla kendi gezi planınızı hazırlayın.'],
  ['04', 'Hatay’ı yaşa', 'Hazırladığınız planla şehri gezin, kültürel mirası yerinde görün ve deneyimleyin.'],
];

const municipalityGoals = [
  ['Kolay erişim', 'Kültürel bilgilere herkesin rahatça ulaşabilmesi'],
  ['Doğru yönlendirme', 'Ziyaretçilerin gezi öncesinde ihtiyaç duyduğu bilgileri bulabilmesi'],
  ['Kültürel farkındalık', 'Hatay’ın zengin mirasının daha yakından tanınması'],
  ['Geleceğe aktarım', 'Tarihi ve kültürel değerlerin yeni kuşaklara anlatılması'],
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
          <span className="about-eyebrow"><IconInfo size={14} /> TKMBS hakkında</span>
          <h1>Hatay'ın tarihi ve kültürel mirası <em>tek yerde.</em></h1>
          <p>
            Tarihi eserleri, kültürel rotaları ve etkinlikleri doğru konum bilgileriyle
            keşfedin; Hatay'ın zengin mirasına tek noktadan ulaşın.
          </p>
          <div className="about-hero-actions">
            <Link className="about-primary-action" to="/harita">Haritayı keşfet <IconArrow size={15} /></Link>
            <Link className="about-secondary-action" to="/tarihi-eserler">Eserleri incele</Link>
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
          <h2>Hatay’ı tanımak ve daha güzel gezmek için</h2>
        </div>
        <div className="about-intro-copy">
          <p>
            Tarihi ve Kültürel Miras Bilgi Sistemi, Hatay’ın binlerce yıllık geçmişini
            vatandaşlarımız ve ziyaretçilerimiz için daha kolay anlaşılır ve erişilebilir
            hale getirmek amacıyla hazırlanmıştır.
          </p>
          <p>
            Ziyaret etmek istediğiniz yer hakkında önceden bilgi edinebilir, konumunu
            haritada görebilir, size uygun kültürel rotayı seçebilir ve gezi gününüzü
            daha verimli planlayabilirsiniz.
          </p>
        </div>
      </section>

      <section className="about-capabilities">
        <div className="about-section-heading centered">
          <span>NASIL YARARLANABİLİRSİNİZ?</span>
          <h2>Keşfedin, öğrenin ve gezinizi planlayın</h2>
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
          <span>HATAY’I KEŞFETME REHBERİ</span>
          <h2>Geziye başlamadan önce ihtiyacınız olan bilgiler</h2>
          <p>
            Gitmek istediğiniz yeri seçin, tarihini ve ziyaret bilgilerini okuyun. Haritadaki
            konumunu inceleyin, yakınındaki diğer eserleri görün ve zamanınıza uygun bir rota
            oluşturarak Hatay’ı kendi hızınızda keşfedin.
          </p>
          <div className="about-data-note">
            <IconInfo size={19} />
            <div><strong>Hatay Büyükşehir Belediyesi</strong><small>Kentimizin tarihi ve kültürel değerlerini tanıtmak, kültür turizmini desteklemek ve vatandaşlarımızın doğru bilgiye kolayca ulaşmasını sağlamak için çalışıyoruz.</small></div>
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
          <span>BELEDİYEMİZİN AMACI</span>
          <h2>Kültürel mirası herkes için görünür kılmak</h2>
          <p>Hatay’ın eşsiz tarihini korurken bu değerlerin vatandaşlarımız, çocuklarımız ve kentimizi ziyaret eden misafirlerimiz tarafından daha iyi tanınmasını amaçlıyoruz.</p>
        </div>
        <div className="about-tech-list">
          {municipalityGoals.map(([name, purpose]) => <article key={name}><strong>{name}</strong><span>{purpose}</span></article>)}
        </div>
      </section>

      <section className="about-closing">
        <div><span>HATAY'I KEŞFET</span><h2>Tarihimizi korumak,<br />geleceğimize aktarmak.</h2></div>
        <Link to="/kultur-rotalari">Kültürel rotalara göz at <IconArrow size={16} /></Link>
      </section>
    </div>
  );
}
