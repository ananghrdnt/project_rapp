import express from "express";
import {
  getTaskGroups,
  getTaskGroupById,
  createTaskGroup,
  updateTaskGroup,
  deleteTaskGroup,
} from "../controllers/TaskGroupController.js";

const router = express.Router();

router.get("/", getTaskGroups);
router.get("/:id", getTaskGroupById);
router.post("/", createTaskGroup);
router.put("/:id", updateTaskGroup);
router.delete("/:id", deleteTaskGroup);

export default router;
