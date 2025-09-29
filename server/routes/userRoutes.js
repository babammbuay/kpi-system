// GET /kpis/assigned-to-me
import express from "express";
import { requireUser } from "../middlewares/authMiddleware.js";
import { getUserKPIs, updateUserKPI, getUserDashboard } from "../controllers/userController.js";

const router = express.Router();

// GET /api/user/kpis
router.get("/kpis", requireUser, getUserKPIs);
router.post("/kpi/update", requireUser, updateUserKPI);
router.get("/user-dashboard", requireUser, getUserDashboard);

export default router;
