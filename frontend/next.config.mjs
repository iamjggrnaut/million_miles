/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'carsensor.net', pathname: '/**' }],
  },
};

export default nextConfig;
