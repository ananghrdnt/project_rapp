// controllers/ITBPController.js
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// GET semua ITBP beserta project
export const getITBP = async (req, res) => {
  try {
    const itbps = await prisma.iTBP.findMany({
      include: {
        projects: true,
      },
    });

    const result = itbps.map((i) => {
      const { password, ...safeData } = i;

      return {
        ...safeData,
        totalProject: i.projects?.length || 0,
      };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Error getITBP:", error);
    res.status(500).json({ msg: error.message });
  }
};

// GET ITBP berdasarkan SAP
export const getITBPById = async (req, res) => {
  try {
    const response = await prisma.iTBP.findUnique({
      where: {
        SAP: Number(req.params.id),
      },
      include: {
        projects: true,
      },
    });

    if (!response) {
      return res.status(404).json({ msg: "ITBP not found" });
    }

    const { password, ...safeData } = response;

    res.status(200).json(safeData);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// CREATE ITBP baru (hash password)
export const createITBP = async (req, res) => {
  const { SAP, name, username, password, position } = req.body;

  try {
    // Cek username di tabel ITBP
    const existingITBP = await prisma.iTBP.findUnique({ where: { username } });
    if (existingITBP) {
      return res.status(400).json({ msg: "Username already exists in ITBP" });
    }

    // Cek juga username di tabel Engineer
    const existingEngineer = await prisma.engineer.findUnique({ where: { username } });
    if (existingEngineer) {
      return res.status(400).json({ msg: "Username already exists in Engineer" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newITBP = await prisma.iTBP.create({
      data: {
        SAP,
        name,
        username,
        password: hashedPassword,
        position,
      },
    });

    const { password: _, ...safeData } = newITBP;
    res.status(201).json(safeData);
  } catch (error) {
    console.error("Error createITBP:", error);
    res.status(400).json({ msg: error.message });
  }
};


// UPDATE ITBP (hash password baru jika diubah)
export const updateITBP = async (req, res) => {
  const { name, username, position, oldPassword, newPassword } = req.body;
  const SAP = Number(req.params.id);

  try {
    const currentITBP = await prisma.iTBP.findUnique({ where: { SAP } });
    if (!currentITBP) {
      return res.status(404).json({ msg: "ITBP not found" });
    }

    // Cek username unik
    if (username && username !== currentITBP.username) {
      const existingITBP = await prisma.iTBP.findFirst({
        where: { username, NOT: { SAP } },
      });
      if (existingITBP) {
        return res.status(400).json({ msg: "Username already exists in ITBP" });
      }

      const existingEngineer = await prisma.engineer.findUnique({ where: { username } });
      if (existingEngineer) {
        return res.status(400).json({ msg: "Username already exists in Engineer" });
      }
    }

    const dataToUpdate = { name, username, position };

    // 🔹 Jika user ingin ganti password
    if (oldPassword && newPassword) {
      const isMatch = await bcrypt.compare(oldPassword, currentITBP.password);
      if (!isMatch) {
        return res.status(400).json({ msg: "Old password is incorrect" });
      }
      dataToUpdate.password = await bcrypt.hash(newPassword, 10);
    }

    const updatedITBP = await prisma.iTBP.update({
      where: { SAP },
      data: dataToUpdate,
    });

    const { password, ...safeData } = updatedITBP;
    res.status(200).json(safeData);
  } catch (error) {
    console.error("Error updateITBP:", error);
    res.status(400).json({ msg: error.message });
  }
};


// DELETE ITBP
export const deleteITBP = async (req, res) => {
  try {
    await prisma.iTBP.delete({
      where: {
        SAP: Number(req.params.id),
      },
    });
    res.status(200).json({ msg: "ITBP deleted" });
  } catch (error) {
    console.error("Error deleteITBP:", error);
    res.status(400).json({ msg: error.message });
  }
};
