import { defineConfig } from 'vitest/config'

// Tests Node à la racine (migration SQL sur PGlite). Les tests du moteur tournent
// dans packages/scoring ; les smoke tests HTTP sont des scripts (`pnpm test:api`).
export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    testTimeout: 120_000,
    hookTimeout: 120_000,
    fileParallelism: false,
  },
})
