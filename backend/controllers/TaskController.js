import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// ======================================================
// GET ALL TASKS
// ======================================================
// ======================================================
export const getTask = async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        project: true,
        user: {
          include: {
            role: true, // <-- penting untuk kanban per role
          },
        },
        group: true,
        platform: true,
        histories: true,
      },
    });

    const result = tasks.map((t) => {
      const sortedHistory = (t.histories || []).sort(
        (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
      );

      return {
        ...t,
        updated_by: t.updated_by || "-",
        update_history: sortedHistory,
      };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Error getTask:", error);
    res.status(500).json({ msg: error.message });
  }
};


// ======================================================
// GET TASK BY ID
// ======================================================
export const getTaskById = async (req, res) => {
  try {
    const { id_task } = req.params;

    const t = await prisma.task.findUnique({
      where: { id_task },
      include: {
        project: true,
        user: {
          include: {
            role: true, // <-- wajib include role
          },
        },
        group: true,
        platform: true,
        histories: true,
      },
    });

    if (!t) return res.status(404).json({ msg: "Task not found" });

    const sortedHistory = (t.histories || []).sort(
      (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
    );

    res.status(200).json({
      ...t,
      updated_by: t.updated_by || "-",
      update_history: sortedHistory,
    });
  } catch (error) {
    console.error("Error getTaskById:", error);
    res.status(500).json({ msg: error.message });
  }
};


// ======================================================
// CREATE TASK
// ======================================================
export const createTask = async (req, res) => {
  const {
    id_project,
    assigned_to,
    task_group_id,
    task_detail,
    plan_start_date,
    plan_end_date,
    actual_start,
    actual_end,
    platform_id,
    task_progress,
    status,
  } = req.body;

  try {
    const createdBy = req.user?.username || "Unknown";

    const task = await prisma.task.create({
      data: {
        id_project,
        assigned_to: assigned_to ? Number(assigned_to) : null,
        task_group_id,
        task_detail,
        plan_start_date: plan_start_date ? new Date(plan_start_date) : null,
        plan_end_date: plan_end_date ? new Date(plan_end_date) : null,
        actual_start: actual_start ? new Date(actual_start) : null,
        actual_end: actual_end ? new Date(actual_end) : null,
        platform_id: platform_id ? Number(platform_id) : null,
        task_progress: task_progress || 0,
        status: status || "TO_DO",
        created_by: createdBy,
      },
    });

    res.status(201).json({
      ...task,
      updated_by: "-",
    });
  } catch (error) {
    console.error("Error createTask:", error);
    res.status(400).json({ msg: error.message });
  }
};

// ======================================================
// UPDATE TASK + HISTORY TRACKING
// ======================================================
export const updateTask = async (req, res) => {
  const { id_task } = req.params;
  const {
    id_project,
    assigned_to,
    task_group_id,
    task_detail,
    plan_start_date,
    plan_end_date,
    actual_start,
    actual_end,
    platform_id,
    task_progress,
    status,
  } = req.body;

  try {
    const updatedBy = req.user?.username || "Unknown";

    const oldTask = await prisma.task.findUnique({
      where: { id_task },
      include: { user: true },
    });
    if (!oldTask) return res.status(404).json({ msg: "Task not found" });

    const task = await prisma.task.update({
      where: { id_task },
      data: {
        id_project,
        assigned_to: assigned_to ? Number(assigned_to) : null,
        task_group_id,
        task_detail,
        plan_start_date: plan_start_date ? new Date(plan_start_date) : null,
        plan_end_date: plan_end_date ? new Date(plan_end_date) : null,
        actual_start: actual_start ? new Date(actual_start) : null,
        actual_end: actual_end ? new Date(actual_end) : null,
        platform_id: platform_id ? Number(platform_id) : null,
        task_progress: task_progress || 0,
        status: status || "TO_DO",
        updated_by: updatedBy,
        updated_at: new Date(),
      },
    });

    // === BANDINKAN PERUBAHAN ===
    const changedFields = [];
    for (const key in task) {
      if (["id_task", "created_at", "updated_at", "created_by", "updated_by"].includes(key))
        continue;

      const oldVal = oldTask[key];
      const newVal = task[key];
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        if (key === "assigned_to") {
          const oldEngineer = oldVal
            ? (await prisma.user.findUnique({ where: { SAP: oldVal } }))?.name || "-"
            : "-";
          const newEngineer = newVal
            ? (await prisma.user.findUnique({ where: { SAP: newVal } }))?.name || "-"
            : "-";
          changedFields.push(`Assigned: '${oldEngineer}' → '${newEngineer}'`);
        } else if (key === "task_group_id") {
          const oldGroup = oldVal
            ? (await prisma.taskGroup.findUnique({ where: { id_group: oldVal } }))?.task_group || "-"
            : "-";
          const newGroup = newVal
            ? (await prisma.taskGroup.findUnique({ where: { id_group: newVal } }))?.task_group || "-"
            : "-";
          changedFields.push(`Task Group: '${oldGroup}' → '${newGroup}'`);
        } else if (key === "platform_id") {
          const oldPlat = oldVal
            ? (await prisma.platform.findUnique({ where: { id_platform: oldVal } }))?.platform || "-"
            : "-";
          const newPlat = newVal
            ? (await prisma.platform.findUnique({ where: { id_platform: newVal } }))?.platform || "-"
            : "-";
          changedFields.push(`Platform: '${oldPlat}' → '${newPlat}'`);
        } else {
          changedFields.push(`${key}: '${oldVal ?? "-"}' → '${newVal ?? "-"}'`);
        }
      }
    }

    if (changedFields.length > 0) {
      await prisma.taskHistory.create({
        data: {
          id_task: task.id_task,
          updated_by: updatedBy,
          changes: changedFields.join(", "),
        },
      });
    }

    res.status(200).json(task);
  } catch (error) {
    console.error("Error updateTask:", error);
    if (error.code === "P2003") {
      return res.status(400).json({
        msg: "Engineer, Group, atau Platform tidak ditemukan (Foreign Key Error).",
      });
    }
    res.status(400).json({ msg: error.message });
  }
};

// ======================================================
// DELETE TASK
// ======================================================
export const deleteTask = async (req, res) => {
  try {
    const { id_task } = req.params;

    const task = await prisma.task.delete({ where: { id_task } });

    res.status(200).json({ msg: "Task berhasil dihapus", task });
  } catch (error) {
    console.error("Error deleteTask:", error);
    res.status(400).json({ msg: error.message });
  }
};

// ======================================================
// GET TASKS BY PROJECT ID
// ======================================================
export const getTasksByProject = async (req, res) => {
  try {
    const { id_project } = req.params;

    const tasks = await prisma.task.findMany({
      where: { id_project },
      include: {
        user: {
          include: {
            role: true, // <-- include role juga
          },
        },
        group: true,
        platform: true,
        histories: true,
      },
    });

    const result = tasks.map((t) => {
      const sortedHistory = (t.histories || []).sort(
        (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
      );
      return { ...t, updated_by: t.updated_by || "-", update_history: sortedHistory };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Error getTasksByProject:", error);
    res.status(500).json({ msg: error.message });
  }
};
