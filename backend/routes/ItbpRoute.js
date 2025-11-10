import express from "express";
import {
  getITBP,
  getITBPById,
  createITBP,
  updateITBP,
  deleteITBP,
} from "../controllers/ItbpController.js";

const router = express.Router();

router.get("/itbp", getITBP);
router.get("/itbp/:id", getITBPById);
router.post("/itbp", createITBP);
router.patch("/itbp/:id", updateITBP);
router.delete("/itbp/:id", deleteITBP);

export default router;
