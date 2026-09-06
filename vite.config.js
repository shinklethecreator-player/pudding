import { defineConfig } from 'vite';

export default defineConfig({
  base: '/pudding/',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
});
