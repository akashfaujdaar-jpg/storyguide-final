export function pageHead(title: string, description: string, path: string, noindex = false) {
  return {
    meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: path },
      { name: 'twitter:card', content: 'summary_large_image' },
      ...(noindex ? [{ name: 'robots', content: 'noindex, follow' }] : []),
    ],
    links: [{ rel: 'canonical', href: path }],
  };
}