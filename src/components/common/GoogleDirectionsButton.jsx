import { IconMap } from './Icons';
import './GoogleDirectionsButton.css';

export default function GoogleDirectionsButton({ href }) {
  if (!href) return null;

  return (
    <a
      className="google-directions-fixed"
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Rotayı Google Haritalar'da araç yol tarifi olarak aç"
    >
      <span><IconMap size={23} /></span>
      <strong>Google Haritalar’da Yol Tarifi</strong>
    </a>
  );
}
