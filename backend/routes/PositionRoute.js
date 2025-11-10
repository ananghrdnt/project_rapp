import express from "express";
import {
  getPositions,
  getPositionById,
  createPosition,
  updatePosition,
  deletePosition,
} from "../controllers/PositionController.js";

const router = express.Router();

// ===============================
// ROUTES: POSITION CRUD
// ===============================

// ✅ Get all positions
router.get("/", getPositions);

// ✅ Get position by ID
router.get("/:id", getPositionById);

// ✅ Create new position
router.post("/", createPosition);

// ✅ Update existing position
router.put("/:id", updatePosition);

// ✅ Delete position
router.delete("/:id", deletePosition);

export default router;
