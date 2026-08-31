import { useEffect } from 'react';
import { useCatalog } from '../context/CatalogContext';
import { imgUrl } from '../lib/img';

/** Applies admin-managed branding (title, favicon, theme colours) to the page. */
const SiteBranding = () => {
  const { settings } = useCatalog();

  useEffect(() => {
    if (!settings) return;
    const name = settings.siteName || 'Allv2Store';
    document.title = settings.tagline ? `${name} - ${settings.tagline}` : name;

    if (settings.faviconUrl) {
      let link = document.querySelector("link[rel='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = imgUrl(settings.faviconUrl);
    }

    const root = document.documentElement;
    if (settings.primaryColor) root.style.setProperty('--brand-primary', settings.primaryColor);
    if (settings.accentColor) root.style.setProperty('--brand-accent', settings.accentColor);
  }, [settings]);

  return null;
};

export default SiteBranding;
