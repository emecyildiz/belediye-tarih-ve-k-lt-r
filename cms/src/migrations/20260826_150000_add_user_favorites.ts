import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "tkmbs_portal_users" (
      "id" uuid PRIMARY KEY,
      "name" text NOT NULL,
      "email" text NOT NULL UNIQUE,
      "role" varchar(20) NOT NULL CHECK ("role" IN ('citizen', 'editor', 'admin')),
      "password_hash" text NOT NULL,
      "active" boolean NOT NULL DEFAULT true,
      "created_at" timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS "tkmbs_user_favorites" (
      "user_id" uuid NOT NULL REFERENCES "tkmbs_portal_users"("id") ON DELETE CASCADE,
      "item_type" varchar(20) NOT NULL CHECK ("item_type" IN ('monument', 'route', 'event')),
      "item_id" integer NOT NULL,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY ("user_id", "item_type", "item_id")
    );
    CREATE INDEX IF NOT EXISTS "tkmbs_user_favorites_user_type_idx"
      ON "tkmbs_user_favorites"("user_id", "item_type");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS "tkmbs_user_favorites";`)
}
