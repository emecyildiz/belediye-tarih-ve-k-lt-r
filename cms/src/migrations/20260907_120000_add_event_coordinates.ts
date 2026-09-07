import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "events"
      ADD COLUMN IF NOT EXISTS "coordinates_latitude" numeric,
      ADD COLUMN IF NOT EXISTS "coordinates_longitude" numeric;

    ALTER TABLE "_events_v"
      ADD COLUMN IF NOT EXISTS "version_coordinates_latitude" numeric,
      ADD COLUMN IF NOT EXISTS "version_coordinates_longitude" numeric;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "_events_v"
      DROP COLUMN IF EXISTS "version_coordinates_longitude",
      DROP COLUMN IF EXISTS "version_coordinates_latitude";

    ALTER TABLE "events"
      DROP COLUMN IF EXISTS "coordinates_longitude",
      DROP COLUMN IF EXISTS "coordinates_latitude";
  `)
}
