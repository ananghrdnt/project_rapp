-- CreateTable
CREATE TABLE "public"."ProjectHistory" (
    "id_history" SERIAL NOT NULL,
    "id_project" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT NOT NULL,
    "changes" TEXT,

    CONSTRAINT "ProjectHistory_pkey" PRIMARY KEY ("id_history")
);

-- AddForeignKey
ALTER TABLE "public"."ProjectHistory" ADD CONSTRAINT "ProjectHistory_id_project_fkey" FOREIGN KEY ("id_project") REFERENCES "public"."Project"("id_project") ON DELETE CASCADE ON UPDATE CASCADE;
