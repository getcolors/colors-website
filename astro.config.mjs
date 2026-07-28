// @ts-check
import { defineConfig } from "astro/config";

// Old routes are not listed here. The site is a single page, and Caddy issues a
// 301 to / for anything that 404s — see the handle_errors block in Caddyfile.prod.

// https://astro.build/config
export default defineConfig({
  // SITE_URL exists so a preview build can advertise a preview host in
  // og:image and canonical. Production builds leave it unset — the Dockerfile
  // runs a bare `pnpm build`, so deploys always use the real domain.
  site: process.env.SITE_URL || "https://www.getcolors.ai",

  server: {
    allowedHosts: true,
    // PORT comes from .envrc (via direnv), defaults to 4321 as Astro convention
    port: parseInt(process.env.PORT || "4321"),
  },
});
