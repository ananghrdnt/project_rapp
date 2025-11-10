import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

/**
 * 🔹 GET Semua User
 * Bisa difilter berdasarkan role (ADMIN, ITBP, DATA_SCIENCE, dll)
 */
export const getUsers = async (req, res) => {
  try {
    const { role } = req.query; // optional query ?role=ITBP

    const users = await prisma.user.findMany({
      where: role ? { role: { role: role.toString() } } : {},
      include: {
        role: true,
        position: true,
        projects: true,
        tasks: true,
      },
    });

    const result = users.map(({ password, tasks, projects, ...u }) => {
  const activeProjects = projects?.filter(
    (p) => p.status === "TO_DO" || p.status === "IN_PROGRESS"
  ) || [];

  const activeTasks = tasks?.filter(
    (t) => t.status === "TO_DO" || t.status === "IN_PROGRESS"
  ) || [];

  return {
    ...u,
    totalProjects: activeProjects.length,
    totalTasks: activeTasks.length,
  };
});


    res.status(200).json(result);
  } catch (error) {
    console.error("Error getUsers:", error);
    res.status(500).json({ msg: error.message });
  }
};

/**
 * 🔹 GET User berdasarkan SAP
 */
export const getUserById = async (req, res) => {
  try {
    const SAP = Number(req.params.id);
    const user = await prisma.user.findUnique({
      where: { SAP },
      include: {
        role: true,
        position: true,
        projects: true,
        tasks: true,
      },
    });

    if (!user) return res.status(404).json({ msg: "User not found" });

    const { password, ...safeData } = user;
    res.status(200).json(safeData);
  } catch (error) {
    console.error("Error getUserById:", error);
    res.status(500).json({ msg: error.message });
  }
};

/**
 * 🔹 CREATE User (hash password otomatis)
 */
export const createUser = async (req, res) => {
  const { SAP, name, username, password, role_id, position_id } = req.body;

  try {
    // Cek username unik
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return res.status(400).json({ msg: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        SAP,
        name,
        username,
        password: hashedPassword,
        role_id,
        position_id: position_id || null,
      },
      include: {
        role: true,
        position: true,
      },
    });

    const { password: _, ...safeData } = newUser;
    res.status(201).json(safeData);
  } catch (error) {
    console.error("Error createUser:", error);
    res.status(400).json({ msg: error.message });
  }
};


/**
 * 🔹 UPDATE User
 */
/**
 * 🔹 UPDATE User (support ubah password)
 */
/**
 * 🔹 UPDATE User (support admin & user profile)
 */
export const updateUser = async (req, res) => {
  const SAP = Number(req.params.id);
  const {
    name,
    username,
    role_id,
    position_id,
    oldPassword,
    newPassword,
    password, // admin only
  } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { SAP } });
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Cek username unik
    if (username && username !== user.username) {
      const existing = await prisma.user.findFirst({
        where: { username, NOT: { SAP } },
      });
      if (existing)
        return res.status(400).json({ msg: "Username already exists" });
    }

    const dataToUpdate = {
      name,
      username,
    };

    // ✅ Hanya admin yang bisa ubah role/position
    if (role_id !== undefined) dataToUpdate.role_id = role_id;
    if (position_id !== undefined) dataToUpdate.position_id = position_id;

    // 🔹 1️⃣ Admin ubah password langsung
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      dataToUpdate.password = hashed;
    }

    // 🔹 2️⃣ User ubah password via profile
    if (oldPassword && newPassword) {
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch)
        return res.status(400).json({ msg: "Current password is incorrect" });

      const hashed = await bcrypt.hash(newPassword, 10);
      dataToUpdate.password = hashed;
    }

    const updatedUser = await prisma.user.update({
      where: { SAP },
      data: dataToUpdate,
      include: { role: true, position: true },
    });

    const { password: _, role, position, ...safeData } = updatedUser;
    res.status(200).json({
      ...safeData,
      role: role?.role || null,
      position: position?.position || null,
    });
  } catch (error) {
    console.error("Error updateUser:", error);
    res.status(400).json({ msg: error.message });
  }
};


/**
 * 🔹 DELETE User
 */
export const deleteUser = async (req, res) => {
  try {
    const SAP = Number(req.params.id);
    await prisma.user.delete({ where: { SAP } });
    res.status(200).json({ msg: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleteUser:", error);
    res.status(400).json({ msg: error.message });
  }
};
