const strapiUrl = new URL(process.env.STRAPI_URL ?? 'http://localhost:1337');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Hero slide (and later catalog) images are served from Strapi's uploads.
    remotePatterns: [
      {
        protocol: strapiUrl.protocol.replace(':', ''),
        hostname: strapiUrl.hostname,
        port: strapiUrl.port,
        pathname: '/uploads/**',
      },
    ],
  },
};

export default nextConfig;
