import express from "express";
import Notification from "../models/notification.js";
import { requireUser, checkAdmin } from "../middlewares/authMiddleware.js";
import {
  getUserNotifications,
  getAdminNotifications,
  markAsRead
} from "../controllers/notiController.js";

const router = express.Router();

// ดึง notifications ของ user
router.get("/user", requireUser, getUserNotifications);

// ดึง notifications ของ admin
router.get("/admin", requireUser, checkAdmin, getAdminNotifications);

router.put("/read/:id", requireUser, async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { isRead: true });
    res.json({ message: "Marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
