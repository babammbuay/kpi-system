import KPI from "../models/kpi.js";
import User from "../models/user.js";
import KPIUpdate from "../models/kpiUpdate.js";
import Notification from "../models/notification.js";

// ดึง KPI ที่ user ถูกมอบหมาย
export const getUserKPIs = async (req, res) => {
  try {
    const userId = req.user._id;

    const kpis = await KPI.find({ assigned_users: userId })
      .populate("assigned_users", "username email role")
      .populate("created_by", "username email");

    res.json(kpis);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateUserKPI = async (req, res) => {
  const { kpi_id, status_task, actual_value, status_kpi, comment } = req.body;
  const userId = req.user._id;

  try {
    const kpi = await KPI.findById(kpi_id).populate(
      "created_by",
      "_id username"
    );
    if (!kpi)
      return res
        .status(404)
        .json({ status: "error", message: "KPI not found" });

    const oldStatusTask = kpi.status_task;
    const oldActualValue = kpi.actual_value;
    const oldStatusKPI = kpi.status_kpi;

    kpi.status_task = status_task;
    kpi.actual_value = actual_value;
    kpi.status_kpi = status_kpi;
    await kpi.save();

    await KPIUpdate.create({
      kpi_id,
      updated_by: userId,
      action: "update",
      changes: {
        status_task: [oldStatusTask, status_task],
        actual_value: [oldActualValue, actual_value],
        status_kpi: [oldStatusKPI, status_kpi],
      },
      comment,
    });

    // Notification
    if (kpi.created_by?._id) {
      await Notification.create({
        user: kpi.created_by._id,
        message: `${req.user.username} updated KPI "${kpi.title}". Status: ${status_kpi}`,
        type: "in-app",
      });
    }

    res.json({ status: "success" });
  } catch (err) {
    console.error("❌ Error updating KPI:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ฟังก์ชันดึงข้อมูล Dashboard ของ user
export const getUserDashboard = async (req, res) => {
  const { period } = req.query;
  const userId = req.user._id; // user ปัจจุบัน

  try {
    // กำหนดช่วงเวลา
    let startDate;
    const now = new Date();

    switch (period) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "weekly":
        const day = now.getDay(); // 0 = Sunday
        startDate = new Date(now);
        startDate.setDate(now.getDate() - day); // วันอาทิตย์ที่ผ่านมา
        startDate.setHours(0, 0, 0, 0);
        break;
      case "monthly":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "yearly":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0); // ถ้าไม่มีค่า → ทั้งหมด
    }

    // ดึง KPI ตามช่วงเวลา **และได้รับมอบหมายให้ user เท่านั้น**
    const kpis = await KPI.find({
      start_date: { $gte: startDate },
      assigned_users: userId, // <-- filter user
    }).populate("assigned_users created_by");

    // สรุป KPI Status และ Task Status
    const kpiSummary = { onTrack: 0, atRisk: 0, offTrack: 0 };
    const taskSummary = { notStarted: 0, inProgress: 0, completed: 0 };

    kpis.forEach((k) => {
      // KPI Status
      if (k.status_kpi === "On Track") kpiSummary.onTrack++;
      else if (k.status_kpi === "At Risk") kpiSummary.atRisk++;
      else if (k.status_kpi === "Off Track") kpiSummary.offTrack++;

      // Task Status
      if (k.status_task === "Not Started") taskSummary.notStarted++;
      else if (k.status_task === "In Progress") taskSummary.inProgress++;
      else if (k.status_task === "Completed") taskSummary.completed++;
    });

    // ส่งผลลัพธ์
    res.json({ kpiSummary, taskSummary, kpis });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
