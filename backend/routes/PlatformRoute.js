import express from "express";
import {
  getPlatforms,
  getPlatformById,
  createPlatform,
  updatePlatform,
  deletePlatform,
} from "../controllers/PlatformController.js";

const router = express.Router();

router.get("/", getPlatforms);
router.get("/:id", getPlatformById);
router.post("/", createPlatform);
router.patch("/:id", updatePlatform);
router.delete("/:id", deletePlatform);

export default router;
