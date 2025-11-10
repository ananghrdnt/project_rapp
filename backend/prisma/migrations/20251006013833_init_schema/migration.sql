-- CreateEnum
CREATE TYPE "public"."ProjectType" AS ENUM ('NEW_PROJECT', 'ENHANCEMENT');

-- CreateEnum
CREATE TYPE "public"."ProjectLevel" AS ENUM ('HIGH', 'MID', 'LOW');

-- CreateEnum
CREATE TYPE "public"."ProjectStatus" AS ENUM ('TO_DO', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."PositionType" AS ENUM ('BACKEND', 'FRONTEND', 'FULLSTACK', 'MOBILE');

-- CreateTable
CREATE TABLE "public"."Engineer" (
    "SAP" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "position" "public"."PositionType" NOT NULL,

    CONSTRAINT "Engineer_pkey" PRIMARY KEY ("SAP")
);

-- CreateTable
CREATE TABLE "public"."Project" (
    "id_project" SERIAL NOT NULL,
    "SAP" INTEGER NOT NULL,
    "project_name" VARCHAR(200) NOT NULL,
    "project_type" "public"."ProjectType" NOT NULL,
    "level" "public"."ProjectLevel" NOT NULL,
    "req_date" DATE,
    "plan_start_date" DATE,
    "plan_end_date" DATE,
    "actual_start" DATE,
    "actual_end" DATE,
    "live_date" DATE,
    "project_progress" INTEGER NOT NULL DEFAULT 0,
    "remark" TEXT,
    "status" "public"."ProjectStatus" NOT NULL DEFAULT 'TO_DO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id_project")
);

-- CreateTable
CREATE TABLE "public"."Task" (
    "id_task" SERIAL NOT NULL,
    "id_project" INTEGER NOT NULL,
    "SAP" INTEGER NOT NULL,
    "task_group" VARCHAR(100) NOT NULL,
    "task_detail" VARCHAR(200) NOT NULL,
    "plan_start_date" DATE,
    "plan_end_date" DATE,
    "actual_start" DATE,
    "actual_end" DATE,
    "platform" VARCHAR(100),
    "task_progress" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."ProjectStatus" NOT NULL DEFAULT 'TO_DO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id_task")
);

-- CreateIndex
CREATE UNIQUE INDEX "Engineer_username_key" ON "public"."Engineer"("username");

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_SAP_fkey" FOREIGN KEY ("SAP") REFERENCES "public"."Engineer"("SAP") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_id_project_fkey" FOREIGN KEY ("id_project") REFERENCES "public"."Project"("id_project") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_SAP_fkey" FOREIGN KEY ("SAP") REFERENCES "public"."Engineer"("SAP") ON DELETE RESTRICT ON UPDATE CASCADE;
