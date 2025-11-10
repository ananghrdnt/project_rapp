import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// GET semua engineer
export const getEngineer = async (req, res) => {
  try {
    const engineers = await prisma.engineer.findMany({
      include: {
        tasks: true, // tambahkan relasi
      },
    });

    // Hapus password & tambahkan count task
    const result = engineers.map(({ password, tasks, ...safeData }) => ({
      ...safeData,
      taskCount: tasks.length,
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error("Error getEngineer:", error);
    res.status(500).json({ msg: error.message });
  }
};


// GET engineer berdasarkan SAP
export const getEngineerById = async (req, res) => {
  try {
    const response = await prisma.engineer.findUnique({
      where: { SAP: Number(req.params.id) },
    });

    if (!response) return res.status(404).json({ msg: "Engineer not found" });

    const { password, ...safeData } = response;
    res.status(200).json(safeData);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// CREATE engineer baru
export const createEngineer = async (req, res) => {
  const { SAP, name, username, password, position } = req.body;

  try {
    // Cek username di tabel Engineer
    const existingEngineer = await prisma.engineer.findUnique({ where: { username } });
    if (existingEngineer) {
      return res.status(400).json({ msg: "Username already exists in Engineer" });
    }

    // Cek juga username di tabel ITBP
    const existingITBP = await prisma.iTBP.findUnique({ where: { username } });
    if (existingITBP) {
      return res.status(400).json({ msg: "Username already exists in ITBP" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newEngineer = await prisma.engineer.create({
      data: { SAP, name, username, password: hashedPassword, position },
    });

    const { password: _, ...safeData } = newEngineer;
    res.status(201).json(safeData);
  } catch (error) {
    console.error("Error createEngineer:", error);
    res.status(400).json({ msg: error.message });
  }
};

// UPDATE engineer
export const updateEngineer = async (req, res) => {
  const { name, username, position, oldPassword, newPassword } = req.body;
  const SAP = Number(req.params.id);

  try {
    const currentEngineer = await prisma.engineer.findUnique({ where: { SAP } });
    if (!currentEngineer) {
      return res.status(404).json({ msg: "Engineer not found" });
    }

    // Cek username unik
    if (username && username !== currentEngineer.username) {
      const existingEngineer = await prisma.engineer.findFirst({
        where: { username, NOT: { SAP } },
      });
      if (existingEngineer) {
        return res.status(400).json({ msg: "Username already exists in Engineer" });
      }

      const existingITBP = await prisma.iTBP.findUnique({ where: { username } });
      if (existingITBP) {
        return res.status(400).json({ msg: "Username already exists in ITBP" });
      }
    }

    // 🔹 Jika user ingin ganti password
    const dataToUpdate = { name, username, position };
    if (oldPassword && newPassword) {
      const isMatch = await bcrypt.compare(oldPassword, currentEngineer.password);
      if (!isMatch) {
        return res.status(400).json({ msg: "Old password is incorrect" });
      }
      dataToUpdate.password = await bcrypt.hash(newPassword, 10);
    }

    const updatedEngineer = await prisma.engineer.update({
      where: { SAP },
      data: dataToUpdate,
    });

    const { password, ...safeData } = updatedEngineer;
    res.status(200).json(safeData);
  } catch (error) {
    console.error("Error updateEngineer:", error);
    res.status(400).json({ msg: error.message });
  }
};


// DELETE engineer
export const deleteEngineer = async (req, res) => {
  try {
    await prisma.engineer.delete({ where: { SAP: Number(req.params.id) } });
    res.status(200).json({ msg: "Engineer deleted" });
  } catch (error) {
    console.error("Error deleteEngineer:", error);
    res.status(400).json({ msg: error.message });
  }
};
