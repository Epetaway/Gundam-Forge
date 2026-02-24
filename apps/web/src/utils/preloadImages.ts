const preloaded = new Set<string>();

/**
 * Preload an array of image URLs using <link rel="prefetch">.
 * Deduplicates URLs so each image is only fetched once per session.
 */
export function preloadImages(urls: (string | undefined)[]): void {
  for (const url of urls) {
    if (!url || preloaded.has(url)) continue;
    preloaded.add(url);

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  }
}
