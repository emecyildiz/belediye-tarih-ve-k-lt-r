const paths = {
  camii: <path d="M7 20h18M9 20v-6h10v6M10 14c1-5 7-5 8 0M22 20V7h2v13M21 7h4M23 4v3" />,
  kilise: <path d="M8 21h16V12l-8-6-8 6zM16 3v11M12 7h8M13 21v-6h6v6" />,
  muze: <path d="M5 9h22L16 3zM7 12h18M8 21h16M10 12v9M16 12v9M22 12v9M6 24h20" />,
  han: <path d="M6 23h20V7H6zM11 23V14c0-7 10-7 10 0v9M6 11h20" />,
  kale: <path d="M6 23h20V8h-4v4h-4V8h-4v4h-4V8H6zM11 23v-6h10v6" />,
  kopru: <path d="M4 21h24M6 21v-5c5-9 15-9 20 0v5M10 19c2-6 10-6 12 0" />,
  doga: <path d="M7 21c12 1 17-7 16-17-10 1-17 5-16 17zM8 20c4-6 8-9 13-13M14 15v9" />,
  diger: <path d="M16 3l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />,
};

export default function CategoryMarkerIcon({ category = 'diger', color = '#64748b', size = 30 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 28"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color }}
      aria-hidden="true"
    >
      {paths[category] || paths.diger}
    </svg>
  );
}
