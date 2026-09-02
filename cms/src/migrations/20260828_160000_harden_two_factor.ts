import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "tkmbs_portal_users"
      ADD COLUMN IF NOT EXISTS "two_factor_recovery_codes" jsonb NOT NULL DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS "two_factor_failed_attempts" integer NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "two_factor_locked_until" timestamptz;

    CREATE TABLE IF NOT EXISTS "tkmbs_security_audit" (
      "id" uuid PRIMARY KEY,
      "user_id" uuid REFERENCES "tkmbs_portal_users"("id") ON DELETE SET NULL,
      "email" text,
      "event_type" varchar(80) NOT NULL,
      "success" boolean NOT NULL,
      "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
      "created_at" timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS "tkmbs_security_audit_created_at_idx" ON "tkmbs_security_audit"("created_at" DESC);
    CREATE INDEX IF NOT EXISTS "tkmbs_security_audit_user_id_idx" ON "tkmbs_security_audit"("user_id", "created_at" DESC);
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "tkmbs_security_audit";
    ALTER TABLE "tkmbs_portal_users"
      DROP COLUMN IF EXISTS "two_factor_locked_until",
      DROP COLUMN IF EXISTS "two_factor_failed_attempts",
      DROP COLUMN IF EXISTS "two_factor_recovery_codes";
  `)
}
