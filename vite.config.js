import { defineConfig } from 'vite';

// Host allowlist for the Cloud preview hostname is supplied per process by the
// environment (STARLIGHT_ALLOWED_HOSTS), so no preview hostname is committed.
const extraHosts = (process.env.STARLIGHT_ALLOWED_HOSTS || '')
  .split(',')
  .map((h) => h.trim())
  .filter(Boolean);

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    allowedHosts: extraHosts,
  },
  preview: {
    host: '0.0.0.0',
    port: 3001,
    allowedHosts: extraHosts,
  },
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
  },
});
