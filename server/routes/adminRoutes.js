import express from "express";
import {
  createUser,
  createKpi,
  getKpis,
  updateKpiValue,
  getAllUsers,
  notifyUsers,
  deleteKpi,
  updateKpi,
  getKpiHistory,
  deleteUser,
  updateUser,
  getKpisCreatedByUser,
  getKpisAssignedToUser,
  getAdminDashboard,
} from "../controllers/adminController.js";
import { requireUser, checkAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/create", requireUser, checkAdmin, createUser);

router.post("/createKpi", requireUser, checkAdmin, createKpi);

router.get("/getKpis", requireUser, checkAdmin, getKpis);

router.get("/users", requireUser, checkAdmin, getAllUsers);
router.delete("/users/:id", requireUser, checkAdmin, deleteUser);
router.put("/users/:id/update", requireUser, checkAdmin, updateUser);

router.put("/:kpiId/update", requireUser, checkAdmin, updateKpiValue);
router.delete("/kpis/:id", requireUser, checkAdmin, deleteKpi);
router.put("/kpis/:id/update", requireUser, checkAdmin, updateKpi);
router.get("/kpis/:id/history", requireUser, checkAdmin, getKpiHistory);

router.post("/notify", requireUser, checkAdmin, notifyUsers);


router.get("/created-by/:userId", requireUser, getKpisCreatedByUser);


router.get("/assigned-to/:userId", requireUser, getKpisAssignedToUser);

router.get("/admin-dashboard", requireUser, getAdminDashboard);

export default router;
