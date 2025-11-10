import express from "express";
import { getRoles } from "../controllers/RoleController.js";

const router = express.Router();

// GET all roles
router.get("/roles", getRoles);

export default router;
