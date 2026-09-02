import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "tkmbs_portal_users"
      ADD COLUMN IF NOT EXISTS "two_factor_enabled" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "two_factor_secret" text,
      ADD COLUMN IF NOT EXISTS "two_factor_pending_secret" text,
      ADD COLUMN IF NOT EXISTS "two_factor_last_used_step" bigint;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "tkmbs_portal_users"
      DROP COLUMN IF EXISTS "two_factor_last_used_step",
      DROP COLUMN IF EXISTS "two_factor_pending_secret",
      DROP COLUMN IF EXISTS "two_factor_secret",
      DROP COLUMN IF EXISTS "two_factor_enabled";
  `)
}
