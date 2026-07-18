/** @type {import('next').NextConfig} */
const nextConfig = {
  // better-sqlite3 is a native module; keep it out of the bundle so it loads at
  // runtime. (Renamed from experimental.serverComponentsExternalPackages in
  // Next 15+.)
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
