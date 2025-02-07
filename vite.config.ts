import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      external: ['node:fs', 'node:path', 'node:path', /node:.*/, 'glob', 'os'],
      output: {
        format: 'es',
        generatedCode: 'es2015',
        compact: true,
        minifyInternalExports: true
      }
    },
    target: 'node18',
    outDir: 'dist',
    emptyOutDir: true,
  }
})