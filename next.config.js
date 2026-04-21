/** @type {import('next').NextConfig} */
const nextConfig = {}

module.exports = nextConfig

// Force all pages to be dynamically rendered (no static prerendering)
// This is needed because pages use Supabase client which requires env vars at build time
