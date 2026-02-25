/** @type {import('next').NextConfig} */

const repoName = 'Gundam-Forge'; // Change if your repo name is different
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Expose basePath to client-side code so image resolvers can prefix paths correctly.
  // NEXT_PUBLIC_* vars are baked in at build time, making them safe for static exports.
  env: {
    NEXT_PUBLIC_BASE_PATH: isProd ? `/${repoName}` : '',
  },
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
