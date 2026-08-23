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
          // Build-time destination. Standalone does not re-read next.config at
          // start, so this must match the container default BACKEND_PORT (8000).
          source: '/api/:path*',
          destination: 'http://127.0.0.1:8000/:path*',
        },
      ],
    };
  },
};

export default nextConfig;
