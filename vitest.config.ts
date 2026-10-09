/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

// Astro's Vite setup, so tests can import astro:content (and mock it) like the site's own code does.
export default getViteConfig({
  test: {
    include: ['src/**/*.test.{ts,mjs}'],
  },
});
