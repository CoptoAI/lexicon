import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  publicDir: false,
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/widget/index.ts'),
      name: 'CoptoLexWidget',
      fileName: () => 'widget.js',
      formats: ['iife']
    },
    rollupOptions: {
      output: {
        exports: 'default'
      }
    },
    outDir: 'public',
    emptyOutDir: false,
    minify: 'esbuild',
    target: 'es2018',
    sourcemap: false
  }
});
