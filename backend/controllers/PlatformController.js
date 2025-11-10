import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// =====================================================
// GET ALL PLATFORMS
// =====================================================
export const getPlatforms = async (req, res) => {
  try {
    const platforms = await prisma.platform.findMany({
      select: {
        id_platform: true,
        platform: true,
      },
      orderBy: {
        platform: "asc",
      },
    });
    res.status(200).json(platforms);
  } catch (error) {
    console.error("Error fetching platforms:", error);
    res.status(500).json({ msg: "Failed to fetch platforms" });
  }
};

// =====================================================
// GET PLATFORM BY ID
// =====================================================
export const getPlatformById = async (req, res) => {
  try {
    const { id } = req.params;
    const platform = await prisma.platform.findUnique({
      where: { id_platform: Number(id) },
      select: {
        id_platform: true,
        platform: true,
      },
    });

    if (!platform)
      return res.status(404).json({ msg: "Platform not found" });

    res.status(200).json(platform);
  } catch (error) {
    console.error("Error fetching platform by ID:", error);
    res.status(500).json({ msg: "Failed to fetch platform" });
  }
};

// =====================================================
// CREATE PLATFORM
// =====================================================
export const createPlatform = async (req, res) => {
  try {
    const { platform } = req.body;

    if (!platform)
      return res.status(400).json({ msg: "Platform name is required" });

    const existing = await prisma.platform.findUnique({
      where: { platform },
    });

    if (existing)
      return res.status(400).json({ msg: "Platform already exists" });

    const newPlatform = await prisma.platform.create({
      data: { platform },
    });

    res.status(201).json({
      msg: "Platform created successfully",
      data: newPlatform,
    });
  } catch (error) {
    console.error("Error creating platform:", error);
    res.status(500).json({ msg: "Failed to create platform" });
  }
};

// =====================================================
// UPDATE PLATFORM
// =====================================================
export const updatePlatform = async (req, res) => {
  try {
    const { id } = req.params;
    const { platform } = req.body;

    const existing = await prisma.platform.findUnique({
      where: { id_platform: Number(id) },
    });

    if (!existing)
      return res.status(404).json({ msg: "Platform not found" });

    const updated = await prisma.platform.update({
      where: { id_platform: Number(id) },
      data: { platform },
    });

    res.status(200).json({
      msg: "Platform updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating platform:", error);
    res.status(500).json({ msg: "Failed to update platform" });
  }
};

// =====================================================
// DELETE PLATFORM
// =====================================================
export const deletePlatform = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.platform.findUnique({
      where: { id_platform: Number(id) },
      include: { tasks: true },
    });

    if (!existing)
      return res.status(404).json({ msg: "Platform not found" });

    if (existing.tasks.length > 0)
      return res.status(400).json({
        msg: "Cannot delete platform that is linked to existing tasks",
      });

    await prisma.platform.delete({
      where: { id_platform: Number(id) },
    });

    res.status(200).json({ msg: "Platform deleted successfully" });
  } catch (error) {
    console.error("Error deleting platform:", error);
    res.status(500).json({ msg: "Failed to delete platform" });
  }
};
