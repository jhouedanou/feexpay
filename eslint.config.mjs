import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

/**
 * Configuration plate ESLint (PLAN.md §9 étape 1). Volontairement posée hors du module
 * `@nuxt/eslint` : le module ajoute une étape au build, alors qu'ici seul le contrôle
 * ponctuel est voulu — `pnpm lint`.
 *
 * Le style de code n'est pas du ressort d'ESLint ici (`stylistic: false`) : Prettier s'en
 * charge.
 */
export default createConfigForNuxt({ features: { stylistic: false } })
  .append({
    // Sources normatives et livrables du client : ce n'est pas du code de ce projet.
    ignores: [
      '.nuxt/**',
      '.output/**',
      'dist/**',
      'node_modules/**',
      'MarketingBS/**',
      'Pack_Handoff_Developpement_Radar_by_FeexPay_V1.1/**',
      'docs/maquette/**',
      'openapi.json',
    ],
  })
  .append({
    files: ['**/*.{ts,vue,mjs}'],
    rules: {
      // Redondant avec TypeScript, et incapable de connaître les imports automatiques de
      // Nuxt sans le module `@nuxt/eslint` : ne produirait que du bruit.
      'no-undef': 'off',
      // Les pages du routeur imposent des noms à un seul mot.
      'vue/multi-word-component-names': 'off',
      // Un `catch` vide est explicite là où un échec ne doit rien interrompre.
      'no-empty': ['error', { allowEmptyCatch: true }],
      // Les variables de rebut sont préfixées d'un souligné.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Les lignes de résultat SQL sont typées au cas par cas ; les `any` restants sont
      // délibérés. Signalés pour qu'on les réduise, pas bloquants.
      '@typescript-eslint/no-explicit-any': 'warn',
      // `data.ts` groupe les imports avec le bloc de version qu'ils servent, c'est plus
      // lisible qu'une pile d'imports en tête de fichier.
      'import/first': 'warn',
    },
  })
