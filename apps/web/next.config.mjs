/** @type {import('next').NextConfig} */

const isStaticExport = process.env.NEXT_OUTPUT_MODE === 'export';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
const normalizedBasePath = basePath.startsWith('/') ? basePath : `/${basePath}`;
const useBasePath = normalizedBasePath !== '/' && normalizedBasePath.length > 1;

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  ...(useBasePath ? { basePath: normalizedBasePath, assetPrefix: normalizedBasePath } : {}),
  ...(isStaticExport ? { output: 'export' } : {}),
  images: {
    ...(isStaticExport ? { unoptimized: true } : {}),
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
