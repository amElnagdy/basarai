const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const remotePatterns = [];

if (supabaseUrl) {
  const { protocol, hostname, port } = new URL(supabaseUrl);

  remotePatterns.push({
    protocol: protocol.replace(':', ''),
    hostname,
    port,
    pathname: '/storage/v1/object/public/**',
  });
}

const backendUrl = (process.env.NEXT_SERVER_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns,
  },
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [
        {
          source: '/api/:path*',
          destination: `${backendUrl}/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
