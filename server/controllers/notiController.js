import KPI from "../models/kpi.js";
import User from "../models/user.js";
import KPIUpdate from "../models/kpiUpdate.js";
import Notification from "../models/notification.js";

// GET notifications สำหรับ user
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50); // จำกัด 50 ล่าสุด
    res.json(notifications);
  } catch (err) {
    console.error("Error fetching user notifications:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET notifications สำหรับ admin
export const getAdminNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ type: "in-app" })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) {
    console.error("Error fetching admin notifications:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// สร้าง notifications อัตโนมัติให้ user
export const generateUserNotifications = async () => {
  try {
    const kpis = await KPI.find({}).populate("assigned_users", "_id");
    const now = new Date();
    const notifications = [];

    for (const kpi of kpis) {
      for (const user of kpi.assigned_users) {

        // KPI In Progress + At Risk
        if (kpi.status_task === "In Progress" && kpi.status_kpi === "At Risk") {
          const exists = await Notification.findOne({
            user: user._id,
            message: `KPI "${kpi.title}" Status: At Risk`
          });
          if (!exists) {
            notifications.push({
              user: user._id,
              message: `KPI "${kpi.title}" Status: At Risk`,
              type: "in-app",
            });
          }
        }

        // KPI ใกล้วันสุดท้าย
        const remainingDays = Math.ceil((kpi.end_date - now) / (1000 * 60 * 60 * 24));
        if (remainingDays <= 3 && kpi.status_task !== "Completed") {
          const exists = await Notification.findOne({
            user: user._id,
            message: `KPI "${kpi.title}" due to (${remainingDays} )`
          });
          if (!exists) {
            notifications.push({
              user: user._id,
              message: `KPI "${kpi.title}" due to (${remainingDays} )`,
              type: "in-app",
            });
          }
        }
      }
    }

    if (notifications.length > 0) await Notification.insertMany(notifications);
  } catch (err) {
    console.error("Error generating user notifications:", err);
  }
};

// notify admin เมื่อ user update KPI
export const notifyAdminOnKpiUpdate = async (kpiId, userId) => {
  try {
    const kpi = await KPI.findById(kpiId).populate("created_by", "_id username");
    const user = await User.findById(userId);
    if (!kpi || !user) return;

    const message = `User "${user.username}" อัปเดต KPI "${kpi.title}" | Status Task: ${kpi.status_task} | Status KPI: ${kpi.status_kpi}`;

    const exists = await Notification.findOne({
      user: kpi.created_by._id,
      message
    });
    if (!exists) {
      await Notification.create({ user: kpi.created_by._id, message, type: "in-app" });
    }
  } catch (err) {
    console.error("Error notifying admin:", err);
  }
};

// daily KPI summary → แจ้ง admin
export const dailyKpiSummaryForAdmin = async () => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const kpisToday = await KPI.find({
      updatedAt: { $gte: startOfDay, $lt: endOfDay }
    });

    const summary = { onTrack: 0, atRisk: 0, offTrack: 0 };
    kpisToday.forEach(kpi => {
      if (kpi.status_kpi === "On Track") summary.onTrack++;
      if (kpi.status_kpi === "At Risk") summary.atRisk++;
      if (kpi.status_kpi === "Off Track") summary.offTrack++;
    });

    const admins = await User.find({ role: "admin" });
    const notifications = admins.map(admin => ({
      user: admin._id,
      message: `สรุป KPI วันนี้: On Track=${summary.onTrack}, At Risk=${summary.atRisk}, Off Track=${summary.offTrack}`,
      type: "in-app"
    }));

    if (notifications.length > 0) await Notification.insertMany(notifications);

  } catch (err) {
    console.error("Error generating daily KPI summary:", err);
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notif = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true } // ✅ return document หลัง update
    );

    if (!notif) return res.status(404).json({ message: "Notification not found" });

    res.json({ message: "Notification marked as read", notification: notif });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
