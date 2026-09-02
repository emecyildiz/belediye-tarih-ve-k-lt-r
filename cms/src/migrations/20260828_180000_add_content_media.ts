import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "media"
      ADD COLUMN IF NOT EXISTS "caption" varchar,
      ADD COLUMN IF NOT EXISTS "credit" varchar,
      ADD COLUMN IF NOT EXISTS "source_url" varchar,
      ADD COLUMN IF NOT EXISTS "license" varchar;

    ALTER TABLE "monuments" ADD COLUMN IF NOT EXISTS "image_media_id" integer;
    ALTER TABLE "_monuments_v" ADD COLUMN IF NOT EXISTS "version_image_media_id" integer;
    ALTER TABLE "cultural_routes" ADD COLUMN IF NOT EXISTS "image_media_id" integer;
    ALTER TABLE "_cultural_routes_v" ADD COLUMN IF NOT EXISTS "version_image_media_id" integer;
    ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "image_media_id" integer;
    ALTER TABLE "_events_v" ADD COLUMN IF NOT EXISTS "version_image_media_id" integer;

    DO $$ BEGIN
      ALTER TABLE "monuments" ADD CONSTRAINT "monuments_image_media_id_media_id_fk" FOREIGN KEY ("image_media_id") REFERENCES "media"("id") ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "_monuments_v" ADD CONSTRAINT "_monuments_v_version_image_media_id_media_id_fk" FOREIGN KEY ("version_image_media_id") REFERENCES "media"("id") ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "cultural_routes" ADD CONSTRAINT "cultural_routes_image_media_id_media_id_fk" FOREIGN KEY ("image_media_id") REFERENCES "media"("id") ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "_cultural_routes_v" ADD CONSTRAINT "_cultural_routes_v_version_image_media_id_media_id_fk" FOREIGN KEY ("version_image_media_id") REFERENCES "media"("id") ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "events" ADD CONSTRAINT "events_image_media_id_media_id_fk" FOREIGN KEY ("image_media_id") REFERENCES "media"("id") ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_image_media_id_media_id_fk" FOREIGN KEY ("version_image_media_id") REFERENCES "media"("id") ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    CREATE INDEX IF NOT EXISTS "monuments_image_media_idx" ON "monuments"("image_media_id");
    CREATE INDEX IF NOT EXISTS "_monuments_v_version_image_media_idx" ON "_monuments_v"("version_image_media_id");
    CREATE INDEX IF NOT EXISTS "cultural_routes_image_media_idx" ON "cultural_routes"("image_media_id");
    CREATE INDEX IF NOT EXISTS "_cultural_routes_v_version_image_media_idx" ON "_cultural_routes_v"("version_image_media_id");
    CREATE INDEX IF NOT EXISTS "events_image_media_idx" ON "events"("image_media_id");
    CREATE INDEX IF NOT EXISTS "_events_v_version_image_media_idx" ON "_events_v"("version_image_media_id");

    CREATE TABLE IF NOT EXISTS "monuments_gallery_media" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "media_id" integer
    );
    CREATE TABLE IF NOT EXISTS "_monuments_v_version_gallery_media" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "media_id" integer,
      "_uuid" varchar
    );
    DO $$ BEGIN
      ALTER TABLE "monuments_gallery_media" ADD CONSTRAINT "monuments_gallery_media_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "monuments"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "monuments_gallery_media" ADD CONSTRAINT "monuments_gallery_media_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "_monuments_v_version_gallery_media" ADD CONSTRAINT "_monuments_v_version_gallery_media_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "_monuments_v"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "_monuments_v_version_gallery_media" ADD CONSTRAINT "_monuments_v_version_gallery_media_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    CREATE INDEX IF NOT EXISTS "monuments_gallery_media_order_idx" ON "monuments_gallery_media"("_order");
    CREATE INDEX IF NOT EXISTS "monuments_gallery_media_parent_id_idx" ON "monuments_gallery_media"("_parent_id");
    CREATE INDEX IF NOT EXISTS "monuments_gallery_media_media_idx" ON "monuments_gallery_media"("media_id");
    CREATE INDEX IF NOT EXISTS "_monuments_v_version_gallery_media_order_idx" ON "_monuments_v_version_gallery_media"("_order");
    CREATE INDEX IF NOT EXISTS "_monuments_v_version_gallery_media_parent_id_idx" ON "_monuments_v_version_gallery_media"("_parent_id");
    CREATE INDEX IF NOT EXISTS "_monuments_v_version_gallery_media_media_idx" ON "_monuments_v_version_gallery_media"("media_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "_monuments_v_version_gallery_media";
    DROP TABLE IF EXISTS "monuments_gallery_media";
    ALTER TABLE "_events_v" DROP COLUMN IF EXISTS "version_image_media_id";
    ALTER TABLE "events" DROP COLUMN IF EXISTS "image_media_id";
    ALTER TABLE "_cultural_routes_v" DROP COLUMN IF EXISTS "version_image_media_id";
    ALTER TABLE "cultural_routes" DROP COLUMN IF EXISTS "image_media_id";
    ALTER TABLE "_monuments_v" DROP COLUMN IF EXISTS "version_image_media_id";
    ALTER TABLE "monuments" DROP COLUMN IF EXISTS "image_media_id";
    ALTER TABLE "media"
      DROP COLUMN IF EXISTS "license",
      DROP COLUMN IF EXISTS "source_url",
      DROP COLUMN IF EXISTS "credit",
      DROP COLUMN IF EXISTS "caption";
  `)
}
