import express from "express";
import {
getUsers,
getUserById,
createUser,
updateUser,
deleteUser,
} from "../controllers/UserController.js";

const router = express.Router();

// 🔹 GET semua user (optional filter: ?role=ENGINEER / ?role=ITBP / ?role=ADMIN)
router.get("/users", getUsers);

// 🔹 GET user berdasarkan SAP
router.get("/users/:id", getUserById);

// 🔹 CREATE user baru
router.post("/users", createUser);

// 🔹 UPDATE user
router.patch("/users/:id", updateUser);

// 🔹 DELETE user
router.delete("/users/:id", deleteUser);

export default router;
