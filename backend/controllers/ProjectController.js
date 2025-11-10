import { PrismaClient } from "@prisma/client";
import ExcelJS from "exceljs";

const prisma = new PrismaClient();

// =====================================================
// GET ALL PROJECTS
// =====================================================
// =====================================================
// GET ALL PROJECTS
// =====================================================
export const getProject = async (req, res) => {
  try {
 const projects = await prisma.project.findMany({
  include: {
    user: {
      include: { role: true }, // 🔄 tambahkan ini
    },
    projectType: { select: { project_type: true } },
    tasks: {
      include: {
        user: true,
        group: true,
        platform: true,
      },
    },
    histories: true,
  },
});


const result = projects
  .map((p) => {
    const totalTasks = p.tasks?.length || 0;
    const completedTasks = p.tasks?.filter(t => t.status === "COMPLETED").length || 0;
    const progress = totalTasks > 0 
      ? Math.round(p.tasks.reduce((sum, t) => sum + (t.task_progress || 0), 0) / totalTasks)
      : 0;

    let status = "TO_DO";
    if (progress === 100) status = "COMPLETED";
    else if (progress > 0) status = "IN_PROGRESS";

    return {
      ...p,
      project_progress: progress,
      status,
      assigned_to_name: p.user?.name || null,
      assigned_to_role: p.user?.role?.role || null,
      project_type_name: p.projectType?.project_type || null,
      actual_start: p.tasks?.length > 0 ? 
                    new Date(Math.min(...p.tasks.filter(t => t.actual_start).map(t => new Date(t.actual_start)))) 
                    : null,
      actual_end:
  completedTasks > 0 && completedTasks === totalTasks
    ? new Date(
        Math.max(
          ...p.tasks
            .filter(t => t.actual_end)
            .map(t => new Date(t.actual_end))
        )
      )
    : null,

      update_history: p.histories?.sort((a,b) => new Date(b.updated_at) - new Date(a.updated_at)) || [],
    };
  })
  // Hanya untuk role ITGA, tampilkan project yang assigned ke ITBP
  .filter(p => {
    const userRole = req.user?.role?.toUpperCase(); // pastikan Anda sudah set req.user di auth middleware
    if (userRole === "ITGA") {
      return p.assigned_to_role === "ITBP";
    }
    return true; // role lain semua project
  });


    res.status(200).json(result);
  } catch (error) {
    console.error("Error getProject:", error);
    res.status(500).json({ msg: error.message });
  }
};

// =====================================================
// GET PROJECT BY ID
// =====================================================
export const getProjectById = async (req, res) => {
  try {
    const { id_project } = req.params;

    const response = await prisma.project.findUnique({
      where: { id_project },
      include: {
        histories: true,
        tasks: {
          include: { user: true, group: true, platform: true },
        },
        user: {
          select: {
            name: true,
            role: { select: { role: true } }, // ✅ ambil role user assigned
          },
        },
        projectType: { select: { project_type: true } },
      },
    });

    if (!response) return res.status(404).json({ msg: "Project not found" });

    const sortedHistory = (response.histories || []).sort(
      (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
    );

    res.status(200).json({
      ...response,
      update_history: sortedHistory,
      assigned_to_name: response.user?.name || null,
      assigned_to_group: response.user?.role?.role || null, // ✅ sekarang dikirim
      project_type_name: response.projectType?.project_type || null,
    });
  } catch (error) {
    console.error("Error getProjectById:", error);
    res.status(500).json({ msg: error.message });
  }
};


// =====================================================
// CREATE PROJECT
// =====================================================
export const createProject = async (req, res) => {
  const {
    assigned_to,
    project_name,
    project_type_id,
    level,
    req_date,
    plan_start_date,
    plan_end_date,
    actual_start,
    actual_end,
    live_date,
    remark,
    status,
  } = req.body;

  try {
    const createdBy = req.user?.username || "Unknown";

    const project = await prisma.project.create({
      data: {
        assigned_to: assigned_to ? Number(assigned_to) : null,
        project_name,
        project_type_id,
        level,
        req_date: req_date ? new Date(req_date) : null,
        plan_start_date: plan_start_date ? new Date(plan_start_date) : null,
        plan_end_date: plan_end_date ? new Date(plan_end_date) : null,
        actual_start: actual_start ? new Date(actual_start) : null,
        actual_end: actual_end ? new Date(actual_end) : null,
        live_date: live_date ? new Date(live_date) : null,
        remark,
        status: status || "TO_DO",
        created_by: createdBy,
        updated_by: createdBy,
      },
      include: {
        user: {
          include: { role: true }, // ✅ ambil role user assigned
        },
        projectType: true,
      },
    });

    res.status(201).json({
      ...project,
      assigned_to_name: project.user?.name || null,
      assigned_to_group: project.user?.role?.role || null, // ✅ tambahkan ke response
    });
  } catch (error) {
    console.error("Error createProject:", error);
    res.status(400).json({ msg: error.message });
  }
};

// =====================================================
// UPDATE PROJECT
// =====================================================
export const updateProject = async (req, res) => {
  let {
    assigned_to,
    project_name,
    project_type_id,
    level,
    req_date,
    plan_start_date,
    plan_end_date,
    actual_start,
    actual_end,
    live_date,
    remark,
    status,
  } = req.body;

  assigned_to = assigned_to ? Number(assigned_to) : null;

  try {
    const { id_project } = req.params;
    const updatedBy = req.user?.username || "Unknown";

    const oldProject = await prisma.project.findUnique({
      where: { id_project },
      include: { user: { include: { role: true } } },
    });
    if (!oldProject) return res.status(404).json({ msg: "Project not found" });

    const project = await prisma.project.update({
      where: { id_project },
      data: {
        assigned_to,
        project_name,
        project_type_id,
        level,
        req_date: req_date ? new Date(req_date) : null,
        plan_start_date: plan_start_date ? new Date(plan_start_date) : null,
        plan_end_date: plan_end_date ? new Date(plan_end_date) : null,
        actual_start: actual_start ? new Date(actual_start) : null,
        actual_end: actual_end ? new Date(actual_end) : null,
        live_date: live_date ? new Date(live_date) : null,
        remark,
        status: status || "TO_DO",
        updated_by: updatedBy,
        updated_at: new Date(),
      },
      include: {
        user: { include: { role: true } },
      },
    });

    // 🔍 Log perubahan (history)
      const changedFields = [];
    const fieldsToCheck = [
      "assigned_to",
      "project_name",
      "project_type_id",
      "level",
      "req_date",
      "plan_start_date",
      "plan_end_date",
      "actual_start",
      "actual_end",
      "live_date",
      "remark",
      "status",
    ];

    for (const key of fieldsToCheck) {
      const oldVal = oldProject[key];
      const newVal = project[key];

      // --- Special case: Assigned user ---
      if (key === "assigned_to") {
        if (oldVal !== newVal) {
          const oldUser = oldProject.user?.name || "Unassigned";
          const newUser = project.user?.name || "Unassigned";
          const oldGroup = oldProject.user?.role?.role || "-";
          const newGroup = project.user?.role?.role || "-";
          changedFields.push(
            `Assigned: '${oldGroup} - ${oldUser}' → '${newGroup} - ${newUser}'`
          );
        }
      }

      // --- Special case: Project type ---
      else if (key === "project_type_id") {
        if (oldVal !== newVal) {
          // ambil nama type lama & baru
          const oldType = await prisma.projectType.findUnique({
            where: { id_type: Number(oldVal) },
            select: { project_type: true },
          });
          const newType = await prisma.projectType.findUnique({
            where: { id_type: Number(newVal) },
            select: { project_type: true },
          });

          changedFields.push(
            `Project Type: '${oldType?.project_type || oldVal}' → '${newType?.project_type || newVal}'`
          );
        }
      }

      // --- Other fields ---
      else {
        const oldStr = oldVal instanceof Date ? oldVal.toISOString().split("T")[0] : oldVal ?? "";
        const newStr = newVal instanceof Date ? newVal.toISOString().split("T")[0] : newVal ?? "";
        if (oldStr !== newStr)
          changedFields.push(`${key}: '${oldStr}' → '${newStr}'`);
      }
    }

    if (changedFields.length > 0) {
      await prisma.projectHistory.create({
        data: {
          id_project: project.id_project,
          updated_by: updatedBy,
          changes: changedFields.join(", "),
        },
      });
    }


    res.status(200).json({
      ...project,
      assigned_to_name: project.user?.name || null,
      assigned_to_group: project.user?.role?.role || null, // ✅ tampilkan role & nama
    });
  } catch (error) {
    console.error("Error updateProject:", error);
    if (error.code === "P2003") {
      return res.status(400).json({ msg: "Assigned user tidak ditemukan (Foreign Key Error)." });
    }
    res.status(400).json({ msg: error.message });
  }
};

// =====================================================
// DELETE PROJECT
// =====================================================
export const deleteProject = async (req, res) => {
  try {
    const id_project = req.params.id_project;
    const tasks = await prisma.task.findMany({ where: { id_project } });

    if (tasks.length > 0) {
      return res.status(400).json({
        msg: "Project tidak bisa dihapus karena sudah memiliki task",
      });
    }

    const project = await prisma.project.delete({ where: { id_project } });
    res.status(200).json({ msg: "Project berhasil dihapus", project });
  } catch (error) {
    console.error("Error deleteProject:", error);
    res.status(400).json({ msg: error.message });
  }
};

// =====================================================
// UPDATE PROJECT PROGRESS
// =====================================================
export const updateProjectProgress = async (req, res) => {
  const { id_project } = req.params;

  try {
    const tasks = await prisma.task.findMany({ where: { id_project } });

    if (!tasks || tasks.length === 0) {
      return res.status(200).json({ msg: "No tasks, project remains unchanged" });
    }

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;

    const progress = Math.round(
      tasks.reduce((sum, t) => sum + (t.task_progress || 0), 0) / totalTasks
    );

    let status = "TO_DO";
    if (progress === 100) status = "COMPLETED";
    else if (progress > 0) status = "IN_PROGRESS";

    const actual_start_task = tasks.find(
      (t) => t.status === "IN_PROGRESS" || t.status === "COMPLETED"
    );
    const actual_start = actual_start_task ? actual_start_task.actual_start : null;

    const actual_end =
      completedTasks === totalTasks
        ? tasks.reduce((latest, t) => {
            const tDate = t.actual_end ? new Date(t.actual_end) : new Date(0);
            return tDate > new Date(latest) ? t.actual_end : latest;
          }, "1970-01-01")
        : null;

    const project = await prisma.project.update({
      where: { id_project },
      data: { project_progress: progress, status, actual_start, actual_end },
    });

    res.status(200).json(project);
  } catch (error) {
    console.error("Error updateProjectProgress:", error);
    res.status(500).json({ msg: error.message });
  }
};

// =====================================================
// DOWNLOAD EXCEL
// =====================================================
export const downloadProjectExcel = async (req, res) => {
  try {
    const { start, end } = req.query;

    const projects = await prisma.project.findMany({
      include: {
        user: { include: { role: true } },
        tasks: {
          include: {
            user: { include: { role: true } },
            group: true,
            platform: true,
          },
        },
        projectType: true,
      },
    });

    // 🔹 Filter berdasarkan tanggal plan_start_date
    const filtered = projects.filter((p) => {
      if (!p.plan_start_date) return false;
      const d = new Date(p.plan_start_date);
      const startDate = start ? new Date(start) : new Date("1970-01-01");
      const endDate = end ? new Date(end) : new Date();
      return d >= startDate && d <= endDate;
    });

    // 🔹 Bagi proyek dan task berdasarkan role user assigned
    const roleGroups = {
      ITBP: { projects: [], tasks: [] },
      ITGA: { projects: [], tasks: [] },
      SAP: { projects: [], tasks: [] },
      DATA_SCIENCE: { projects: [], tasks: [] },
    };

    filtered.forEach((p) => {
      const role = p.user?.role?.role?.toUpperCase() || "UNKNOWN";

      // Kelompokkan project ke role yang sesuai
      if (roleGroups[role]) {
        roleGroups[role].projects.push(p);
        // Kelompokkan task di project ke role task masing-masing
        (p.tasks || []).forEach((t) => {
          const taskRole = t.user?.role?.role?.toUpperCase() || "UNKNOWN";
          if (roleGroups[taskRole]) roleGroups[taskRole].tasks.push({ ...t, project: p });
        });
      }
    });

    const workbook = new ExcelJS.Workbook();

    // 🔹 Helper function buat tambah sheet
    const addProjectSheet = (sheetName, data) => {
      const sheet = workbook.addWorksheet(sheetName);
      sheet.addRow([
        "ID",
        "Project Name",
        "Assigned To",
        "Project Type",
        "Effort",
        "Req Date",
        "Plan Start",
        "Plan End",
        "Actual Start",
        "Actual End",
        "Go Live",
        "Progress",
        "Status",
        "Remark",
      ]);
      data.forEach((p) => {
        sheet.addRow([
          p.id_project,
          p.project_name,
          p.user?.name || "-",
          p.projectType?.project_type || "-",
          p.level,
          p.req_date?.toISOString().split("T")[0] || "-",
          p.plan_start_date?.toISOString().split("T")[0] || "-",
          p.plan_end_date?.toISOString().split("T")[0] || "-",
          p.actual_start?.toISOString().split("T")[0] || "-",
          p.actual_end?.toISOString().split("T")[0] || "-",
          p.live_date?.toISOString().split("T")[0] || "-",
          p.project_progress || 0,
          p.status || "TO_DO",
          p.remark || "-",
        ]);
      });
    };

    const addTaskSheet = (sheetName, data) => {
      const sheet = workbook.addWorksheet(sheetName);
      sheet.addRow([
        "Project ID",
        "Project Name",
        "Task ID",
        "Task Detail",
        "Assigned To",
        "Task Group",
        "Plan Start",
        "Plan End",
        "Actual Start",
        "Actual End",
        "Platform",
        "Progress",
        "Status",
      ]);
      data.forEach((t) => {
        sheet.addRow([
          t.project?.id_project || "-",
          t.project?.project_name || "-",
          t.id_task,
          t.task_detail || "-",
          t.user?.name || "-",
          t.group?.task_group || "-",
          t.plan_start_date?.toISOString().split("T")[0] || "-",
          t.plan_end_date?.toISOString().split("T")[0] || "-",
          t.actual_start?.toISOString().split("T")[0] || "-",
          t.actual_end?.toISOString().split("T")[0] || "-",
          t.platform?.platform || "-",
          t.task_progress || 0,
          t.status || "TO_DO",
        ]);
      });
    };

    // 🔹 Tambahkan sheet per role
    addProjectSheet("project_itbp", roleGroups.ITBP.projects);
    addTaskSheet("task_itga", roleGroups.ITGA.tasks);
    addProjectSheet("project_sap", roleGroups.SAP.projects);
    addTaskSheet("task_sap", roleGroups.SAP.tasks);
    addProjectSheet("project_datascience", roleGroups.DATA_SCIENCE.projects);
    addTaskSheet("task_datascience", roleGroups.DATA_SCIENCE.tasks);

    // 🔹 Kirim ke user
    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=projects_by_role.xlsx");
    res.send(buffer);
  } catch (err) {
    console.error("Download Excel error:", err);
    res.status(500).json({ msg: err.message });
  }
};

