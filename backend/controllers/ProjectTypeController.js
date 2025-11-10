import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// =====================================================
// GET ALL PROJECT TYPES
// =====================================================
export const getProjectTypes = async (req, res) => {
  try {
    const projectTypes = await prisma.projectType.findMany({
      select: {
        id_type: true,
        project_type: true,
      },
      orderBy: {
        project_type: "asc",
      },
    });
    res.status(200).json(projectTypes);
  } catch (error) {
    console.error("Error fetching Project Types:", error);
    res.status(500).json({ msg: "Failed to fetch project types" });
  }
};

// =====================================================
// GET PROJECT TYPE BY ID
// =====================================================
export const getProjectTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const projectType = await prisma.projectType.findUnique({
      where: { id_type: Number(id) },
      select: {
        id_type: true,
        project_type: true,
      },
    });

    if (!projectType)
      return res.status(404).json({ msg: "Project type not found" });

    res.status(200).json(projectType);
  } catch (error) {
    console.error("Error fetching project type by ID:", error);
    res.status(500).json({ msg: "Failed to fetch project type" });
  }
};

// =====================================================
// CREATE PROJECT TYPE
// =====================================================
export const createProjectType = async (req, res) => {
  try {
    const { project_type } = req.body;

    if (!project_type)
      return res.status(400).json({ msg: "Project type name is required" });

    const existing = await prisma.projectType.findUnique({
      where: { project_type },
    });

    if (existing)
      return res.status(400).json({ msg: "Project type already exists" });

    const newType = await prisma.projectType.create({
      data: { project_type },
    });

    res.status(201).json({
      msg: "Project type created successfully",
      data: newType,
    });
  } catch (error) {
    console.error("Error creating project type:", error);
    res.status(500).json({ msg: "Failed to create project type" });
  }
};

// =====================================================
// UPDATE PROJECT TYPE
// =====================================================
export const updateProjectType = async (req, res) => {
  try {
    const { id } = req.params;
    const { project_type } = req.body;

    const existing = await prisma.projectType.findUnique({
      where: { id_type: Number(id) },
    });

    if (!existing)
      return res.status(404).json({ msg: "Project type not found" });

    const updated = await prisma.projectType.update({
      where: { id_type: Number(id) },
      data: { project_type },
    });

    res.status(200).json({
      msg: "Project type updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating project type:", error);
    res.status(500).json({ msg: "Failed to update project type" });
  }
};

// =====================================================
// DELETE PROJECT TYPE
// =====================================================
export const deleteProjectType = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.projectType.findUnique({
      where: { id_type: Number(id) },
      include: { projects: true },
    });

    if (!existing)
      return res.status(404).json({ msg: "Project type not found" });

    if (existing.projects.length > 0)
      return res.status(400).json({
        msg: "Cannot delete project type that is linked to existing projects",
      });

    await prisma.projectType.delete({
      where: { id_type: Number(id) },
    });

    res.status(200).json({ msg: "Project type deleted successfully" });
  } catch (error) {
    console.error("Error deleting project type:", error);
    res.status(500).json({ msg: "Failed to delete project type" });
  }
};
