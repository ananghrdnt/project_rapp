import express from "express";
import { getDashboardProjects } from "../controllers/DashboardController.js";


const router = express.Router();

router.get("/dashboard", getDashboardProjects);

export default router;
