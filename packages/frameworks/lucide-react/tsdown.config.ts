import { defineConfig } from 'vite-plus/pack';

export default defineConfig({
  dts: true,
  exports: true,
  entry: ['src/lucide/index.ts', 'src/lucide/icons/index.ts', 'src/lucide/icons/*.tsx']
});
