import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { downloadProjectExcel } from "../controllers/ProjectController.js";


import {
  getProject,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  updateProjectProgress   // <-- import fungsi baru
} from "../controllers/ProjectController.js";

const router = express.Router();
router.get("/projects/download", authMiddleware, downloadProjectExcel);

router.post('/projects', authMiddleware, createProject);
router.patch('/projects/:id_project', authMiddleware, updateProject);
router.get('/projects', getProject);
router.get('/projects/:id_project', getProjectById);

router.delete('/projects/:id_project', deleteProject);

// Route baru untuk update progress
router.put('/projects/:id_project/update-progress', updateProjectProgress);

export default router;

