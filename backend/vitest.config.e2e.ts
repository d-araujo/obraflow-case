import { defineConfig } from 'vitest/config';
import { urlDoBancoDeTeste } from './test/banco-de-teste.js';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    globalSetup: ['./test/preparar-banco.ts'],
    env: { DATABASE_URL: urlDoBancoDeTeste() },
    fileParallelism: false,
  },
});
