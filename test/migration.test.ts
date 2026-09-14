import { describe, expect, it, beforeAll } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { freshDb } from './pglite'

let pg: PGlite
beforeAll(async () => {
  pg = await freshDb()
})

const q = async <T = any>(sql: string, params?: any[]) => (await pg.query<T>(sql, params)).rows
const fails = async (sql: string, params?: any[]) => {
  try {
    await pg.query(sql, params)
    return null
  } catch (e: any) {
    return String(e.message)
  }
}

describe('migration init', () => {
  it('crée les tables attendues', async () => {
    const rows = await q<{ tablename: string }>(`select tablename from pg_tables where schemaname='public' order by 1`)
    const names = rows.map((r) => r.tablename)
    for (const t of ['scoring_version', 'question', 'option', 'anonymous_session', 'acquisition', 'contact', 'participation', 'answer', 'answer_history', 'score_snapshot', 'insight_snapshot', 'cross_reading', 'report', 'share_asset', 'admin_user', 'admin_recovery_code', 'admin_invitation', 'audit_log', 'notification', 'tracking_event_outbox', 'export_job'])
      expect(names).toContain(t)
  })
  it('RLS forcé partout, aucune policy', async () => {
    const off = await q(`select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and relkind='r' and not (relrowsecurity and relforcerowsecurity)`)
    expect(off).toEqual([])
    expect(await q(`select 1 from pg_policies`)).toEqual([])
  })
  it('une seule version published', async () => {
    await q(`insert into scoring_version (version, status, checksum, published_at) values ('2.1','published','x',now())`)
    expect(await fails(`insert into scoring_version (version, status, checksum, published_at) values ('2.2','published','y',now())`)).toMatch(/one_published|unique/i)
  })
  it('version published gelée', async () => {
    expect(await fails(`update scoring_version set checksum='z' where version='2.1'`)).toMatch(/VERSION_LOCKED/)
    expect(await fails(`delete from scoring_version where version='2.1'`)).toMatch(/VERSION_LOCKED/)
    expect(await fails(`update scoring_version set status='draft' where version='2.1'`)).toMatch(/VERSION_LOCKED/)
  })
  it('answer : option doit appartenir à la question ; history journalisée ; UNIQUE', async () => {
    const [v] = await q(`select id from scoring_version`)
    const [q1] = await q(`insert into question (version_id, code, diagnostic_type, ordre, texte) values ($1,'Q1','dirigeant',1,'t') returning id`, [v.id])
    const [q2] = await q(`insert into question (version_id, code, diagnostic_type, ordre, texte) values ($1,'Q2','dirigeant',2,'t') returning id`, [v.id])
    const [o1a] = await q(`insert into "option" (question_id, code, lettre, texte, mapping) values ($1,'Q1A','A','t','{}') returning id`, [q1.id])
    const [o1b] = await q(`insert into "option" (question_id, code, lettre, texte, mapping) values ($1,'Q1B','B','t','{}') returning id`, [q1.id])
    const [o2a] = await q(`insert into "option" (question_id, code, lettre, texte, mapping) values ($1,'Q2A','A','t','{}') returning id`, [q2.id])
    const [s] = await q(`insert into anonymous_session (token_hash, expires_at) values ('h', now() + interval '7 days') returning id`)
    const [p] = await q(`insert into participation (session_id, diagnostic_type, version_id, token_hash) values ($1,'dirigeant',$2,'ph') returning id`, [s.id, v.id])
    expect(await fails(`insert into answer (participation_id, question_id, option_id) values ($1,$2,$3)`, [p.id, q1.id, o2a.id])).toMatch(/INVALID_ANSWER/)
    await q(`insert into answer (participation_id, question_id, option_id) values ($1,$2,$3)`, [p.id, q1.id, o1a.id])
    await q(`insert into answer (participation_id, question_id, option_id) values ($1,$2,$3) on conflict (participation_id, question_id) do update set option_id = excluded.option_id, revised_at = now()`, [p.id, q1.id, o1b.id])
    expect(await q(`select count(*)::int as c from answer where participation_id=$1`, [p.id])).toEqual([{ c: 1 }])
    expect(await q(`select count(*)::int as c from answer_history where participation_id=$1`, [p.id])).toEqual([{ c: 2 }])
    expect(await fails(`delete from answer_history`)).toMatch(/IMMUTABLE_ROW/)
  })
  it('snapshots immuables, 1 par participation', async () => {
    const [p] = await q(`select id, version_id from participation`)
    await q(`insert into score_snapshot (participation_id, version_id, scores, result) values ($1,$2,'{}','{}')`, [p.id, p.version_id])
    expect(await fails(`insert into score_snapshot (participation_id, version_id, scores, result) values ($1,$2,'{}','{}')`, [p.id, p.version_id])).toMatch(/unique|duplicate/i)
    expect(await fails(`update score_snapshot set scores='{"a":1}'`)).toMatch(/IMMUTABLE_ROW/)
    expect(await fails(`insert into insight_snapshot (participation_id, version_id, items) values ($1,$2,'{"product":1}')`, [p.id, p.version_id])).toMatch(/check/i)
  })
  it('acquisition first-touch : 1 par session, immuable', async () => {
    const [s] = await q(`select id from anonymous_session`)
    await q(`insert into acquisition (session_id, landing_url) values ($1,'a')`, [s.id])
    expect(await fails(`insert into acquisition (session_id, landing_url) values ($1,'b')`, [s.id])).toMatch(/unique|duplicate/i)
    expect(await fails(`update acquisition set landing_url='c'`)).toMatch(/IMMUTABLE_ROW/)
  })
  it('admin : domaine feexpay.me, dernier admin protégé, audit append-only', async () => {
    await q(`insert into auth.users (id) values ('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002')`)
    expect(await fails(`insert into admin_user (id, prenom, nom, email, role, status) values ('00000000-0000-0000-0000-000000000001','a','b','a@gmail.com','admin','active')`)).toMatch(/check/i)
    await q(`insert into admin_user (id, prenom, nom, email, role, status) values ('00000000-0000-0000-0000-000000000001','a','b','a@feexpay.me','admin','active')`)
    expect(await fails(`update admin_user set status='suspended' where email='a@feexpay.me'`)).toMatch(/LAST_ADMIN_GUARD/)
    await q(`insert into admin_user (id, prenom, nom, email, role, status) values ('00000000-0000-0000-0000-000000000002','c','d','c@feexpay.me','admin','active')`)
    await q(`update admin_user set status='suspended' where email='a@feexpay.me'`)
    await q(`insert into audit_log (actor_id, action, target_type) values ('00000000-0000-0000-0000-000000000002','x','y')`)
    expect(await fails(`delete from audit_log`)).toMatch(/IMMUTABLE_ROW/)
  })
  it('notification : exactement un parent', async () => {
    expect(await fails(`insert into notification (template, recipient) values ('t','x@y.z')`)).toMatch(/check/i)
  })
  it('notification : la réinitialisation est un parent admis, et un seul', async () => {
    // La contrainte d'origine (`notification_check`) n'admettait que deux parents ; la
    // migration la remplace. Si le remplacement échouait en silence, l'insertion
    // ci-dessous serait refusée.
    const contraintes = await q<{ conname: string }>(
      `select conname from pg_constraint where conrelid='notification'::regclass and contype='c'`,
    )
    expect(contraintes.map((c) => c.conname)).toEqual(['notification_origine_unique'])

    const [u] = await q(`select id from admin_user where status='active' limit 1`)
    const [r] = await q(
      `insert into admin_password_reset (admin_user_id, token_hash, expires_at)
       values ($1,'rh', now() + interval '1 hour') returning id`,
      [u.id],
    )
    await q(`insert into notification (admin_password_reset_id, template, recipient) values ($1,'reinitialisation-admin','a@feexpay.me')`, [r.id])
    // Deux parents à la fois restent interdits.
    const [inv] = await q(
      `insert into admin_invitation (email, role, token_hash, inviter_id, expires_at)
       values ('z@feexpay.me','lecture','ih',$1, now() + interval '7 days') returning id`,
      [u.id],
    )
    expect(
      await fails(
        `insert into notification (admin_password_reset_id, admin_invitation_id, template, recipient) values ($1,$2,'t','a@feexpay.me')`,
        [r.id, inv.id],
      ),
    ).toMatch(/check/i)
  })
})
