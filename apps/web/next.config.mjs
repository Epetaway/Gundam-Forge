/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      // Primary card art source — also downloaded locally by fetchCardAssets
      { protocol: 'https', hostname: 'exburst.dev' },
      // Official Gundam card image host used by HQ fetch tooling
      { protocol: 'https', hostname: 'www.gundam-gcg.com' },
      { protocol: 'https', hostname: 'gundam-gcg.com' },
      // Placeholder art (placehold.co SVGs used as last-resort fallback)
      { protocol: 'https', hostname: 'placehold.co' },
    ],
  },
};

export default nextConfig;
