// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Cek apakah ada header Authorization
    if (!authHeader) {
      return res.status(401).json({ msg: "Unauthorized: No token provided" });
    }

    // Ambil token dari header "Bearer <token>"
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ msg: "Unauthorized: Invalid token format" });
    }

    // Verifikasi token pakai secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Simpan semua data penting dari payload JWT ke req.user
    req.user = {
      SAP: decoded.SAP,
      username: decoded.username,
      name: decoded.name,
      role: decoded.role, // ADMIN / ITBP / ENGINEER
    };

    next(); // lanjut ke controller berikutnya
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ msg: "Invalid or expired token" });
  }
  
};
