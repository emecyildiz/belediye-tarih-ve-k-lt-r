import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  IconArrow, IconCalendar, IconInfo, IconMap,
  IconMonument, IconPin, IconRoute,
} from '../components/common/Icons';
import './AboutPage.css';

const iconMap = {
  monument: IconMonument,
  map: IconMap,
  route: IconRoute,
  calendar: IconCalendar,
  pin: IconPin,
};

export default function AboutPage() {
  const [statistics, setStatistics] = useState(null);
  const [content, setContent] = useState(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([api.getStatistics(), api.getAboutContent()])
      .then(([statisticsData, contentData]) => {
        if (active) {
          setStatistics(statisticsData);
          setContent(contentData);
        }
      })
      .catch((error) => {
        console.error('Hakkında sayfası verileri yüklenemedi:', error);
        if (active) setLoadError(true);
      });
    return () => { active = false; };
  }, []);

  if (loadError) return <div className="about-page"><div className="about-page-state">Hakkında içeriği şu anda görüntülenemiyor.</div></div>;
  if (!content) return <div className="about-page"><div className="about-page-state">Hakkında içeriği yükleniyor…</div></div>;

  const summaryValues = {
    monuments: statistics?.toplamEser,
    routes: statistics?.kulturRota,
    events: statistics?.etkinlik,
    locations: statistics?.harita?.toplamEser,
  };

  return (
    <div className="about-page">
      <section className="about-hero" style={{ '--about-hero-image': `url("${content.hero.backgroundImage}")` }}>
        <div className="about-hero-copy">
          <span className="about-eyebrow"><IconInfo size={14} /> {content.hero.eyebrow}</span>
          <h1>{content.hero.title} <em>{content.hero.emphasis}</em></h1>
          <p>{content.hero.description}</p>
          <div className="about-hero-actions">
            {content.hero.actions.map((action) => <Link key={action.href} className={`about-${action.variant}-action`} to={action.href}>{action.label}{action.variant === 'primary' && <IconArrow size={15} />}</Link>)}
          </div>
        </div>
      </section>

      <section className="about-summary" aria-label="Sistem özeti">
        {content.summary.map((item) => {
          const Icon = iconMap[item.icon] || IconInfo;
          return <article key={item.key}>
            <span><Icon size={19} /></span>
            <div><strong>{summaryValues[item.key] ?? '—'}</strong><small>{item.label}</small></div>
          </article>;
        })}
      </section>

      <section className="about-intro">
        <div className="about-section-heading">
          <span>{content.introduction.eyebrow}</span>
          <h2>{content.introduction.title}</h2>
        </div>
        <div className="about-intro-copy">
          {content.introduction.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
      </section>

      <section className="about-capabilities">
        <div className="about-section-heading centered">
          <span>{content.capabilities.eyebrow}</span>
          <h2>{content.capabilities.title}</h2>
        </div>
        <div className="about-capability-grid">
          {content.capabilities.items.map((item) => {
            const Icon = iconMap[item.icon] || IconInfo;
            return <article key={item.title}>
              <span><Icon size={22} /></span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>;
          })}
        </div>
      </section>

      <section className="about-data-flow">
        <div className="about-flow-copy">
          <span>{content.guide.eyebrow}</span>
          <h2>{content.guide.title}</h2>
          <p>{content.guide.description}</p>
          <div className="about-data-note">
            <IconInfo size={19} />
            <div><strong>{content.guide.noteTitle}</strong><small>{content.guide.noteText}</small></div>
          </div>
        </div>
        <ol className="about-process-list">
          {content.guide.steps.map((step) => (
            <li key={step.number}><b>{step.number}</b><div><strong>{step.title}</strong><p>{step.text}</p></div></li>
          ))}
        </ol>
      </section>

      <section className="about-technology">
        <div className="about-section-heading">
          <span>{content.municipality.eyebrow}</span>
          <h2>{content.municipality.title}</h2>
          <p>{content.municipality.description}</p>
        </div>
        <div className="about-tech-list">
          {content.municipality.goals.map((goal) => <article key={goal.title}><strong>{goal.title}</strong><span>{goal.text}</span></article>)}
        </div>
      </section>

      <section className="about-closing">
        <div><span>{content.closing.eyebrow}</span><h2>{content.closing.title}<br />{content.closing.secondLine}</h2></div>
        <Link to={content.closing.action.href}>{content.closing.action.label} <IconArrow size={16} /></Link>
      </section>
    </div>
  );
}
