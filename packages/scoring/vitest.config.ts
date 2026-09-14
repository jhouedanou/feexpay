import { defineConfig } from 'vitest/config'

// Config propre au package : sans elle, vitest remonte au vitest.config.ts de
// la racine et cherche son globalSetup PGlite dans packages/scoring/test/.
export default defineConfig({
  test: { include: ['test/**/*.test.ts'] },
})
