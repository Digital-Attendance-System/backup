/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Use remotePatterns instead of domains (Next.js 16+)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'backup-ozj7.onrender.com',
        port: '',
        pathname: '/**',
      },
      // Also add your actual backend URL if different
      {
        protocol: 'https',
        hostname: 'backup-oz7.onrender.com',  // Note: your error log showed oz7, not ozj7
        port: '',
        pathname: '/**',
      },
    ],
  },
  // These options are now handled via CLI flags or separate configs
  // Remove eslint and typescript blocks from next.config.js
}

module.exports = nextConfig