import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  getTask,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getTasksByProject,
} from "../controllers/TaskController.js";

const router = express.Router();

router.get("/tasks", getTask);
router.get("/tasks/:id_task", getTaskById);
router.post("/tasks", authMiddleware, createTask);
router.patch("/tasks/:id_task", authMiddleware, updateTask);
router.delete("/tasks/:id_task", deleteTask);

// ambil task per project
router.get("/projects/:id_project/tasks", getTasksByProject);

export default router;
