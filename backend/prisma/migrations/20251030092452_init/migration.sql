-- CreateEnum
CREATE TYPE "public"."ProjectLevel" AS ENUM ('HIGH', 'MID', 'LOW');

-- CreateEnum
CREATE TYPE "public"."ProjectStatus" AS ENUM ('TO_DO', 'IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "public"."Role" (
    "id_role" SERIAL NOT NULL,
    "role" VARCHAR(50) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id_role")
);

-- CreateTable
CREATE TABLE "public"."Position" (
    "id_position" SERIAL NOT NULL,
    "position" VARCHAR(100) NOT NULL,
    "role_id" INTEGER NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id_position")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "SAP" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role_id" INTEGER NOT NULL,
    "position_id" INTEGER,

    CONSTRAINT "User_pkey" PRIMARY KEY ("SAP")
);

-- CreateTable
CREATE TABLE "public"."ProjectType" (
    "id_type" SERIAL NOT NULL,
    "project_type" VARCHAR(100) NOT NULL,

    CONSTRAINT "ProjectType_pkey" PRIMARY KEY ("id_type")
);

-- CreateTable
CREATE TABLE "public"."Project" (
    "id_project" VARCHAR(50) NOT NULL DEFAULT concat('prj_', (floor(random() * 1000000))::text),
    "project_name" VARCHAR(200) NOT NULL,
    "project_type_id" INTEGER NOT NULL,
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
    "assigned_to" INTEGER,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id_project")
);

-- CreateTable
CREATE TABLE "public"."TaskGroup" (
    "id_group" SERIAL NOT NULL,
    "task_group" VARCHAR(100) NOT NULL,

    CONSTRAINT "TaskGroup_pkey" PRIMARY KEY ("id_group")
);

-- CreateTable
CREATE TABLE "public"."Platform" (
    "id_platform" SERIAL NOT NULL,
    "platform" VARCHAR(100) NOT NULL,

    CONSTRAINT "Platform_pkey" PRIMARY KEY ("id_platform")
);

-- CreateTable
CREATE TABLE "public"."Task" (
    "id_task" VARCHAR(50) NOT NULL DEFAULT concat('task_', (floor(random() * 1000000))::text),
    "id_project" TEXT NOT NULL,
    "task_detail" VARCHAR(200) NOT NULL,
    "task_group_id" INTEGER NOT NULL,
    "platform_id" INTEGER,
    "plan_start_date" DATE,
    "plan_end_date" DATE,
    "actual_start" DATE,
    "actual_end" DATE,
    "task_progress" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."ProjectStatus" NOT NULL DEFAULT 'TO_DO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "assigned_to" INTEGER,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id_task")
);

-- CreateTable
CREATE TABLE "public"."ProjectHistory" (
    "id_history" SERIAL NOT NULL,
    "id_project" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT NOT NULL,
    "changes" TEXT,

    CONSTRAINT "ProjectHistory_pkey" PRIMARY KEY ("id_history")
);

-- CreateTable
CREATE TABLE "public"."TaskHistory" (
    "id_history" SERIAL NOT NULL,
    "id_task" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT NOT NULL,
    "changes" TEXT,

    CONSTRAINT "TaskHistory_pkey" PRIMARY KEY ("id_history")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_role_key" ON "public"."Role"("role");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectType_project_type_key" ON "public"."ProjectType"("project_type");

-- CreateIndex
CREATE UNIQUE INDEX "TaskGroup_task_group_key" ON "public"."TaskGroup"("task_group");

-- CreateIndex
CREATE UNIQUE INDEX "Platform_platform_key" ON "public"."Platform"("platform");

-- AddForeignKey
ALTER TABLE "public"."Position" ADD CONSTRAINT "Position_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."Role"("id_role") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."Role"("id_role") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."Position"("id_position") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."User"("SAP") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_project_type_id_fkey" FOREIGN KEY ("project_type_id") REFERENCES "public"."ProjectType"("id_type") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."User"("SAP") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_id_project_fkey" FOREIGN KEY ("id_project") REFERENCES "public"."Project"("id_project") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_task_group_id_fkey" FOREIGN KEY ("task_group_id") REFERENCES "public"."TaskGroup"("id_group") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "public"."Platform"("id_platform") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectHistory" ADD CONSTRAINT "ProjectHistory_id_project_fkey" FOREIGN KEY ("id_project") REFERENCES "public"."Project"("id_project") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskHistory" ADD CONSTRAINT "TaskHistory_id_task_fkey" FOREIGN KEY ("id_task") REFERENCES "public"."Task"("id_task") ON DELETE CASCADE ON UPDATE CASCADE;
