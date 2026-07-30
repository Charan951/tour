import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  schemaMarkup?: object | object[];
}

export const SEO: React.FC<SEOProps> = ({
  title = 'HolidayCity | Explore. Experience. Enjoy.',
  description = 'Book domestic & international tour packages with HolidayCity. Discover Kerala, Bali, Kashmir, Dubai, Maldives, Vietnam and customizable travel itineraries.',
  keywords = [
    'holiday packages',
    'kerala tour packages',
    'kashmir tour packages',
    'dubai tour packages',
    'maldives honeymoon package',
    'thailand packages',
    'bali tour packages',
    'travel agency'
  ],
  canonicalUrl,
  ogImage = 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=1200&auto=format&fit=crop',
  ogType = 'website',
  schemaMarkup
}) => {
  const currentUrl = canonicalUrl || (typeof window !== 'undefined' ? window.location.href : 'https://holidaycity.com');

  // Base Organization & WebSite Schemas matching seo.md Section 4
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    name: 'HolidayCity',
    url: 'https://holidaycity.com',
    logo: 'https://holidaycity.com/logo.png',
    slogan: 'Explore. Experience. Enjoy.',
    description: 'Premier travel agency providing domestic and international tour packages.',
    sameAs: [
      'https://facebook.com/holidaycity',
      'https://instagram.com/holidaycity',
      'https://twitter.com/holidaycity'
    ]
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'HolidayCity',
    url: 'https://holidaycity.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://holidaycity.com/packages?search={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  };

  const schemasToRender = [
    organizationSchema,
    websiteSchema,
    ...(Array.isArray(schemaMarkup) ? schemaMarkup : schemaMarkup ? [schemaMarkup] : [])
  ];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}
      <link rel="canonical" href={currentUrl} />

      {/* OpenGraph Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="HolidayCity" />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* JSON-LD Schemas */}
      {schemasToRender.map((schema, idx) => (
        <script key={idx} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};
