import { useEffect, useState } from 'react';
import { DEFAULT_IMAGE, getImageUrl } from '../../services/api';

export default function SafeImage({ src, alt = '', ...props }) {
  const [resolvedSrc, setResolvedSrc] = useState(getImageUrl(src));

  useEffect(() => {
    setResolvedSrc(getImageUrl(src));
  }, [src]);

  return (
    <img
      {...props}
      src={resolvedSrc}
      alt={alt}
      onError={() => {
        if (resolvedSrc !== DEFAULT_IMAGE) setResolvedSrc(DEFAULT_IMAGE);
      }}
    />
  );
}
