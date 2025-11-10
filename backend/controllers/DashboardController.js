import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getDashboardProjects = async (req, res) => {
  try {
    const userRole = req.query.role?.toLowerCase() || "admin";
    const userName = req.query.name?.toLowerCase() || "";

const projects = await prisma.project.findMany({
  include: {
    user: {
      include: { role: true }, // 🔹 tambahkan ini
    },
    tasks: {
      include: {
        user: {
          include: { role: true }, // 🔹 tambahkan ini juga
        },
      },
    },
  },
  orderBy: { plan_start_date: "asc" },
});


    const projectsSummary = projects
      .filter((p) => {
        const projectAssigned =
          p.user?.name?.toLowerCase() === userName; // project di-assign ke dia

        const hasAssignedTask = p.tasks.some(
          (t) => t.user?.name?.toLowerCase() === userName
        ); // task di-assign ke dia

        // 🔹 ITBP hanya project assigned
        if (userRole === "itbp") return projectAssigned;

        // 🔹 ITGA hanya task assigned
        if (userRole === "itga") return hasAssignedTask;

        // 🔹 SAP & Data Science: project assigned ATAU ada task assigned
        if (["sap", "data_science"].includes(userRole))
          return projectAssigned || hasAssignedTask;

        // 🔹 Admin: semua
        return true;
      })
      .map((p) => {
        const filteredTasks =
          ["itga", "sap", "data_science"].includes(userRole)
            ? p.tasks.filter(
                (t) => t.user?.name?.toLowerCase() === userName
              )
            : p.tasks;

        const totalTasks = filteredTasks.length;
        const completedTasks = filteredTasks.filter(
          (t) => t.status === "COMPLETED"
        ).length;

        const startedTasks = filteredTasks.filter((t) => t.actual_start);
        const actual_start =
          startedTasks.length > 0
            ? new Date(
                Math.min(
                  ...startedTasks.map((t) => new Date(t.actual_start))
                )
              )
            : null;

        const actual_end =
          completedTasks === totalTasks && totalTasks > 0
            ? filteredTasks.reduce((latest, t) => {
                const tDate = t.actual_end
                  ? new Date(t.actual_end)
                  : new Date(0);
                return tDate > new Date(latest) ? t.actual_end : latest;
              }, "1970-01-01")
            : null;

        const engineerNames = [
          ...new Set(
            p.tasks.map((t) => t.user?.name?.toLowerCase()).filter(Boolean)
          ),
        ];

  return {
  id_project: p.id_project,
  project_name: p.project_name,
  plan_start_date: p.plan_start_date,
  plan_end_date: p.plan_end_date,
  actual_start,
  actual_end,
  task_todo: filteredTasks.filter((t) => t.status === "TO_DO").length,
  task_inprogress: filteredTasks.filter((t) => t.status === "IN_PROGRESS").length,
  task_completed: completedTasks,
  itbp_name: p.user?.name?.toLowerCase() || null,
  itbp_role: p.user?.role?.role?.toLowerCase() || null, // ⬅️ tambahkan ini
  engineer_names: engineerNames,
  tasks: p.tasks.map((t) => ({
    id_task: t.id_task,
    task_detail: t.task_detail,
    status: t.status,
    assigned_to: t.user?.name?.toLowerCase() || null,
    assigned_role: t.user?.role?.role?.toLowerCase() || null, // ⬅️ tambahkan ini
    plan_end_date: t.plan_end_date,
    actual_start: t.actual_start,
    actual_end: t.actual_end,
    isDelay: t.plan_end_date
      ? new Date(t.plan_end_date) < new Date()
      : false,
  })),
};

      });

    // 🔹 Reminder Tasks (khusus ITGA, SAP, Data Science)
    let reminderTasks = [];
    if (["itga", "sap", "data_science"].includes(userRole)) {
      const now = new Date();
      const sevenDaysLater = new Date();
      sevenDaysLater.setDate(now.getDate() + 7);

     const tasks = await prisma.task.findMany({
  where: {
    user: {
      name: { equals: userName, mode: "insensitive" },
    },
    status: { in: ["TO_DO", "IN_PROGRESS"] },
    OR: [
      { plan_end_date: { lte: sevenDaysLater, gte: now } },
      { plan_end_date: { lt: now } }, // delay
    ],
  },
  include: { project: true },
  orderBy: { plan_end_date: "asc" },
});


      reminderTasks = tasks.map((t) => ({
        id_task: t.id_task,
        task_detail: t.task_detail,
        project_name: t.project.project_name,
        status: t.status,
        plan_end_date: t.plan_end_date,
        isDelay: t.plan_end_date ? new Date(t.plan_end_date) < now : false,
      }));
    }

    res.status(200).json({
      projectsSummary,
      reminderTasks,
    });
  } catch (err) {
    console.error("Error getDashboardProjects:", err);
    res.status(500).json({ msg: err.message });
  }
};

