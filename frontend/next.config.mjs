/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow rendering images from local backend uploads
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
    ],
  },
};

export default nextConfig;
