import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite-plus';

export default defineConfig({
  plugins: [svelte()],
  test: {
    include: ['tests/**/*.{test,spec}.{js,ts}'],
    environment: 'node'
  }
});
