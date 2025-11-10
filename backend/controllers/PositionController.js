import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// =====================================================
// GET ALL POSITIONS
// =====================================================
export const getPositions = async (req, res) => {
  try {
    const positions = await prisma.position.findMany({
      include: { role: true },
      orderBy: { id_position: "asc" },
    });
    res.status(200).json(positions);
  } catch (error) {
    console.error("Error getPositions:", error);
    res.status(500).json({ msg: error.message });
  }
};

// =====================================================
// GET POSITION BY ID
// =====================================================
export const getPositionById = async (req, res) => {
  try {
    const { id } = req.params;
    const position = await prisma.position.findUnique({
      where: { id_position: Number(id) },
      include: { role: true },
    });

    if (!position) return res.status(404).json({ msg: "Position not found" });

    res.status(200).json(position);
  } catch (error) {
    console.error("Error getPositionById:", error);
    res.status(500).json({ msg: error.message });
  }
};

// =====================================================
// CREATE POSITION
// =====================================================
export const createPosition = async (req, res) => {
  try {
    const { position, role_id } = req.body;

    if (!position || !role_id)
      return res.status(400).json({ msg: "Position and role_id are required" });

    const newPosition = await prisma.position.create({
      data: {
        position,
        role_id: Number(role_id),
      },
    });

    res.status(201).json({ msg: "Position created successfully", data: newPosition });
  } catch (error) {
    console.error("Error createPosition:", error);
    res.status(500).json({ msg: error.message });
  }
};

// =====================================================
// UPDATE POSITION
// =====================================================
export const updatePosition = async (req, res) => {
  try {
    const { id } = req.params;
    const { position, role_id } = req.body;

    const existing = await prisma.position.findUnique({
      where: { id_position: Number(id) },
    });
    if (!existing) return res.status(404).json({ msg: "Position not found" });

    const updated = await prisma.position.update({
      where: { id_position: Number(id) },
      data: {
        position,
        role_id: Number(role_id),
      },
    });

    res.status(200).json({ msg: "Position updated successfully", data: updated });
  } catch (error) {
    console.error("Error updatePosition:", error);
    res.status(500).json({ msg: error.message });
  }
};

// =====================================================
// DELETE POSITION
// =====================================================
export const deletePosition = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.position.findUnique({
      where: { id_position: Number(id) },
    });
    if (!existing) return res.status(404).json({ msg: "Position not found" });

    await prisma.position.delete({
      where: { id_position: Number(id) },
    });

    res.status(200).json({ msg: "Position deleted successfully" });
  } catch (error) {
    console.error("Error deletePosition:", error);
    res.status(500).json({ msg: error.message });
  }
};
