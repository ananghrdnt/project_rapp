// routes/EngineerRoute.js
import express from "express";
import {
  getEngineer,
  getEngineerById,
  createEngineer,
  updateEngineer,
  deleteEngineer,
} from "../controllers/EngineerController.js";

const router = express.Router();

router.get('/engineers', getEngineer);
router.get('/engineers/:id', getEngineerById);
router.post('/engineers', createEngineer);
router.patch('/engineers/:id', updateEngineer);
router.delete('/engineers/:id', deleteEngineer);

export default router;
