import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'cultural_routes' AND column_name = 'travel_mode'
      ) THEN
        EXECUTE 'UPDATE "cultural_routes" SET "travel_mode" = ''driving'' WHERE "travel_mode" IS DISTINCT FROM ''driving''';
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = '_cultural_routes_v' AND column_name = 'version_travel_mode'
      ) THEN
        EXECUTE 'UPDATE "_cultural_routes_v" SET "version_travel_mode" = ''driving'' WHERE "version_travel_mode" IS DISTINCT FROM ''driving''';
      END IF;
    END $$;
  `)
}

// Eski ulaşım türleri artık desteklenmediği için geri dönüş veri üretmez.
export async function down(_args: MigrateDownArgs): Promise<void> {}
