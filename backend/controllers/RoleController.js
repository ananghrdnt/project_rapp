import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getRoles = async (req, res) => {
  try {
    const roles = await prisma.role.findMany();
    res.json(roles);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};