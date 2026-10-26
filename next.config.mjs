/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Keep the development badge out of screenshots.
  devIndicators: false,
  // English is served at the root; its pages live on the [locale] routes as /en.
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/', destination: '/en' },
        { source: '/projects/:slug', destination: '/en/projects/:slug' },
        { source: '/stats', destination: '/en/stats' },
      ],
    };
  },
  // One address per page: the /en spelling goes to the root.
  async redirects() {
    return [
      { source: '/en', destination: '/', permanent: true },
      { source: '/en/projects/:slug', destination: '/projects/:slug', permanent: true },
      { source: '/en/stats', destination: '/stats', permanent: true },
      { source: '/he/stats', destination: '/stats', permanent: false },
    ];
  },
};

export default nextConfig;
