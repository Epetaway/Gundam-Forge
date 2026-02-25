/** @type {import('next').NextConfig} */

const repoName = 'Gundam-Forge'; // Change if your repo name is different
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    unoptimized: true, // Required for static export (no /_next/image API at runtime)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.gundam-gcg.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'exburst.dev',
      },
    ],
  },
  output: 'export',
  // Only apply basePath in production so local dev serves at http://localhost:3000/
  ...(isProd && {
    basePath: `/${repoName}`,
    assetPrefix: `/${repoName}/`,
  }),
  trailingSlash: true,
};

export default nextConfig;
