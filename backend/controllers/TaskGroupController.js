import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// ============================================
// GET ALL TASK GROUPS
// ============================================
export const getTaskGroups = async (req, res) => {
  try {
    const groups = await prisma.taskGroup.findMany({
      select: { id_group: true, task_group: true },
      orderBy: { id_group: "asc" },
    });
    res.status(200).json(groups);
  } catch (error) {
    console.error("Error getTaskGroups:", error);
    res.status(500).json({ msg: error.message });
  }
};

// ============================================
// GET TASK GROUP BY ID
// ============================================
export const getTaskGroupById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ msg: "Task group ID is required" });

    const taskGroupId = Number(id);
    if (isNaN(taskGroupId)) return res.status(400).json({ msg: "Invalid task group ID" });

    const group = await prisma.taskGroup.findUnique({
      where: { id_group: taskGroupId },
      select: { id_group: true, task_group: true },
    });

    if (!group) return res.status(404).json({ msg: "Task group not found" });
    res.status(200).json(group);
  } catch (error) {
    console.error("Error getTaskGroupById:", error);
    res.status(500).json({ msg: error.message });
  }
};


// ============================================
// CREATE TASK GROUP
// ============================================
export const createTaskGroup = async (req, res) => {
  try {
    const { task_group } = req.body;

    if (!task_group) return res.status(400).json({ msg: "Task group name is required" });

    const exist = await prisma.taskGroup.findUnique({
      where: { task_group },
    });
    if (exist) return res.status(400).json({ msg: "Task group already exists" });

    const newGroup = await prisma.taskGroup.create({
      data: { task_group },
    });

    res.status(201).json(newGroup);
  } catch (error) {
    console.error("Error createTaskGroup:", error);
    res.status(500).json({ msg: error.message });
  }
};

// ============================================
// UPDATE TASK GROUP
// ============================================
export const updateTaskGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { task_group } = req.body;

    if (!task_group) return res.status(400).json({ msg: "Task group name is required" });

    const existing = await prisma.taskGroup.findUnique({
      where: { id_group: Number(id) },
    });
    if (!existing) return res.status(404).json({ msg: "Task group not found" });

    const updated = await prisma.taskGroup.update({
      where: { id_group: Number(id) },
      data: { task_group },
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error("Error updateTaskGroup:", error);
    res.status(500).json({ msg: error.message });
  }
};

// ============================================
// DELETE TASK GROUP
// ============================================
export const deleteTaskGroup = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.taskGroup.findUnique({
      where: { id_group: Number(id) },
    });
    if (!existing) return res.status(404).json({ msg: "Task group not found" });

    await prisma.taskGroup.delete({
      where: { id_group: Number(id) },
    });

    res.status(200).json({ msg: "Task group deleted successfully" });
  } catch (error) {
    console.error("Error deleteTaskGroup:", error);
    res.status(500).json({ msg: error.message });
  }
};
