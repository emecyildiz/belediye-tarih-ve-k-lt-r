import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "tkmbs_user_routes" (
      "id" uuid PRIMARY KEY,
      "user_id" uuid NOT NULL REFERENCES "tkmbs_portal_users"("id") ON DELETE CASCADE,
      "title" varchar(120) NOT NULL,
      "travel_mode" varchar(20) NOT NULL DEFAULT 'driving' CHECK ("travel_mode" = 'driving'),
      "preview" jsonb,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS "tkmbs_user_routes_user_updated_idx"
      ON "tkmbs_user_routes"("user_id", "updated_at" DESC);

    CREATE TABLE IF NOT EXISTS "tkmbs_user_route_stops" (
      "route_id" uuid NOT NULL REFERENCES "tkmbs_user_routes"("id") ON DELETE CASCADE,
      "monument_id" integer NOT NULL,
      "stop_order" integer NOT NULL CHECK ("stop_order" >= 1),
      PRIMARY KEY ("route_id", "stop_order"),
      UNIQUE ("route_id", "monument_id")
    );
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "tkmbs_user_route_stops";
    DROP TABLE IF EXISTS "tkmbs_user_routes";
  `)
}
