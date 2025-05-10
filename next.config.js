/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
        dangerouslyAllowSVG: true,
        contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' data: https://example.com; style-src 'self' 'unsafe-inline';",
  },
  // Thêm cấu hình khác nếu cần
};

module.exports = nextConfig;