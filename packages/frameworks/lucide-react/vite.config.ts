import tsdownConfig from './tsdown.config.js';

import { defineConfig } from 'vite-plus';

export default defineConfig({
  pack: tsdownConfig,
  test: {
    include: ['tests/**/*.{test,spec}.{js,ts,tsx}'],
    environment: 'node'
  }
});
