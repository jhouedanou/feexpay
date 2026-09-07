import { defineConfig } from 'drizzle-kit'
// Source de vérité : supabase/migrations/*.sql. Drizzle sert d'ORM ; `drizzle-kit pull` pour vérifier server/db/schema.ts.
export default defineConfig({
  dialect: 'postgresql',
  schema: './server/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL! },
})
