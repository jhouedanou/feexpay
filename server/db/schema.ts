// Miroir Drizzle des tables Lot 1–3 (supabase/migrations/20260905000000_init.sql).
import { char, integer, jsonb, pgEnum, pgTable, smallint, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const diagnosticType = pgEnum('diagnostic_type', ['dirigeant', 'rayonnement'])
export const versionStatus = pgEnum('version_status', ['draft', 'published', 'archived'])
export const participationStatus = pgEnum('participation_status', ['in_progress', 'completed', 'abandoned'])

export const scoringVersion = pgTable('scoring_version', {
  id: uuid('id').primaryKey().defaultRandom(),
  version: text('version').notNull().unique(),
  status: versionStatus('status').notNull().default('draft'),
  checksum: text('checksum').notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  authorId: uuid('author_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const question = pgTable('question', {
  id: uuid('id').primaryKey().defaultRandom(),
  versionId: uuid('version_id').notNull().references(() => scoringVersion.id),
  code: text('code').notNull(),
  diagnosticType: diagnosticType('diagnostic_type').notNull(),
  ordre: smallint('ordre').notNull(),
  texte: text('texte').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const option = pgTable('option', {
  id: uuid('id').primaryKey().defaultRandom(),
  questionId: uuid('question_id').notNull().references(() => question.id),
  code: text('code').notNull(),
  lettre: char('lettre', { length: 1 }).notNull(),
  texte: text('texte').notNull(),
  mapping: jsonb('mapping').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const anonymousSession = pgTable('anonymous_session', {
  id: uuid('id').primaryKey().defaultRandom(),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const acquisition = pgTable('acquisition', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().unique().references(() => anonymousSession.id),
  landingUrl: text('landing_url'),
  referrer: text('referrer'),
  utmSource: text('utm_source'),
  utmMedium: text('utm_medium'),
  utmCampaign: text('utm_campaign'),
  utmTerm: text('utm_term'),
  utmContent: text('utm_content'),
  fbclid: text('fbclid'),
  gclid: text('gclid'),
  device: text('device'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const participation = pgTable('participation', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => anonymousSession.id),
  contactId: uuid('contact_id'),
  diagnosticType: diagnosticType('diagnostic_type').notNull(),
  versionId: uuid('version_id').notNull().references(() => scoringVersion.id),
  status: participationStatus('status').notNull().default('in_progress'),
  tokenHash: text('token_hash').notNull().unique(),
  parentParticipationId: uuid('parent_participation_id'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  durationS: integer('duration_s'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const answer = pgTable('answer', {
  id: uuid('id').primaryKey().defaultRandom(),
  participationId: uuid('participation_id').notNull().references(() => participation.id),
  questionId: uuid('question_id').notNull().references(() => question.id),
  optionId: uuid('option_id').notNull().references(() => option.id),
  answeredAt: timestamp('answered_at', { withTimezone: true }).notNull().defaultNow(),
  revisedAt: timestamp('revised_at', { withTimezone: true }),
})

export const scoreSnapshot = pgTable('score_snapshot', {
  id: uuid('id').primaryKey().defaultRandom(),
  participationId: uuid('participation_id').notNull().unique().references(() => participation.id),
  versionId: uuid('version_id').notNull().references(() => scoringVersion.id),
  scores: jsonb('scores').notNull(),
  result: jsonb('result').notNull(),
  tieBreak: jsonb('tie_break'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const insightSnapshot = pgTable('insight_snapshot', {
  id: uuid('id').primaryKey().defaultRandom(),
  participationId: uuid('participation_id').notNull().unique().references(() => participation.id),
  versionId: uuid('version_id').notNull().references(() => scoringVersion.id),
  items: jsonb('items').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
