/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Allow dev access from local device IPs to _next assets (fixes Cross origin dev warning)
  allowedDevOrigins: [
    'http://192.168.1.6'
  ],
}

export default nextConfig
