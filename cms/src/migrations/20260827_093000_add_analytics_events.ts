import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "tkmbs_analytics_events" (
      "id" uuid PRIMARY KEY,
      "event_type" varchar(32) NOT NULL CHECK ("event_type" IN ('page_view')),
      "visitor_id" uuid NOT NULL,
      "session_id" uuid NOT NULL,
      "path" varchar(240) NOT NULL,
      "content_type" varchar(20) CHECK ("content_type" IN ('monument', 'route', 'event')),
      "content_slug" varchar(160),
      "dedupe_key" char(64),
      "occurred_at" timestamptz NOT NULL DEFAULT now(),
      "created_at" timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS "tkmbs_analytics_events_occurred_at_idx"
      ON "tkmbs_analytics_events"("occurred_at" DESC);
    CREATE INDEX IF NOT EXISTS "tkmbs_analytics_events_path_idx"
      ON "tkmbs_analytics_events"("path");
    CREATE INDEX IF NOT EXISTS "tkmbs_analytics_events_visitor_idx"
      ON "tkmbs_analytics_events"("visitor_id", "occurred_at" DESC);
    CREATE UNIQUE INDEX IF NOT EXISTS "tkmbs_analytics_events_dedupe_idx"
      ON "tkmbs_analytics_events"("dedupe_key") WHERE "dedupe_key" IS NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS "tkmbs_analytics_events";`)
}
