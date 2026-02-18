import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  async redirects() {
    return [
      {
        source: '/index',
        destination: '/doc/index',
        permanent: true,
      },
    ];
  },
  webpack(config) {
    config.resolve.alias['@'] = path.join(__dirname, 'src'); // Use path.join for consistency
    return config;
  },
};

export default nextConfig;
