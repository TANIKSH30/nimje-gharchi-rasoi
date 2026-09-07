import React, { useEffect } from 'react';
import { BUSINESS_CONFIG } from '@/config/business';

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonicalPath?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  noIndex?: boolean;
}

export default function SEOHead({
  title,
  description,
  canonicalPath,
  ogImage = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80',
  ogType = 'website',
  noIndex = false,
}: SEOHeadProps) {
  const fullTitle = title
    ? `${title} | ${BUSINESS_CONFIG.name}`
    : `${BUSINESS_CONFIG.name} | Authentic Homestyle Tiffin & Mess Service in Nagpur`;

  const metaDesc = description || BUSINESS_CONFIG.description;
  const canonicalUrl = `${BUSINESS_CONFIG.siteUrl}${canonicalPath || ''}`;

  useEffect(() => {
    // 1. Update Document Title
    document.title = fullTitle;

    // Helper to update or create meta tags
    const setMetaTag = (attrName: string, attrVal: string, content: string) => {
      let el = document.querySelector(`meta[${attrName}="${attrVal}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // Helper to update or create link tags
    const setLinkTag = (rel: string, href: string) => {
      let el = document.querySelector(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    // Description
    setMetaTag('name', 'description', metaDesc);

    // Robots
    if (noIndex) {
      setMetaTag('name', 'robots', 'noindex, nofollow');
    } else {
      setMetaTag('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    }

    // Canonical
    setLinkTag('canonical', canonicalUrl);

    // Open Graph
    setMetaTag('property', 'og:title', fullTitle);
    setMetaTag('property', 'og:description', metaDesc);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:image', ogImage);
    setMetaTag('property', 'og:site_name', BUSINESS_CONFIG.name);
    setMetaTag('property', 'og:locale', 'en_IN');

    // Twitter Card
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', fullTitle);
    setMetaTag('name', 'twitter:description', metaDesc);
    setMetaTag('name', 'twitter:image', ogImage);
  }, [fullTitle, metaDesc, canonicalUrl, ogImage, ogType, noIndex]);

  return null;
}
