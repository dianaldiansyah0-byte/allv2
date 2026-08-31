import React, { useEffect, useState } from 'react';
import { imgUrl } from '../lib/img';

/**
 * Image that gracefully falls back (to a badge/gradient) when the source is
 * missing or fails to load - so a deleted media file never shows a broken icon.
 */
const SafeImg = ({ src, alt, className, fallback = null, ...rest }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [src]);
  if (!src || failed) return fallback;
  return <img src={imgUrl(src)} alt={alt || ''} className={className} onError={() => setFailed(true)} {...rest} />;
};

export default SafeImg;
