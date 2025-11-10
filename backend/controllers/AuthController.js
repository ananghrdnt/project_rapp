import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

// ==========================
// LOGIN untuk semua role (Admin, ITBP, Engineer)
// ==========================
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Cari user berdasarkan username, sekaligus ambil role & position
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        role: true,
        position: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Cek password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Buat JWT token
    const token = jwt.sign(
      {
        SAP: user.SAP,
        username: user.username,
        name: user.name,
        role: user.role.role, // ambil nama role
        position: user.position?.position || null, // ambil nama posisi jika ada
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Kirim response
    res.json({
      message: "Login successful",
      token,
      user: {
        SAP: user.SAP,
        name: user.name,
        username: user.username,
        role: user.role.role,
        position: user.position?.position || null,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
};
