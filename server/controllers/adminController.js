import User from "../models/user.js";
import KPI from "../models/kpi.js";
import KPIUpdate from "../models/kpiUpdate.js";
import bcrypt from "bcryptjs";
import Notification from "../models/notification.js";


export const createKpi = async (req, res) => {
  try {
    const {
      title,
      description,
      assignedUsers,
      start_date,
      end_date,
      target_value,
      unit,
    } = req.body;

    if (
      !title ||
      !description ||
      !start_date ||
      !end_date ||
      !assignedUsers?.length ||
      target_value === undefined ||
      !unit //
    ) {
      return res
        .status(400)
        .json({ message: "กรุณากรอกทุกช่องและเลือกผู้ใช้" });
    }

    // สร้าง KPI
    const newKpi = await KPI.create({
      title,
      description,
      assigned_users: assignedUsers,
      created_by: req.user._id,
      start_date,
      end_date,
      target_value,
      unit,
      status_task: "Not Started",
    });

    // สร้าง notifications
    const notifications = assignedUsers.map((userId) => ({
      user: userId,
      message: `You have been assigned a new KPI: ${title}`,
      type: "in-app",
    }));

    await Notification.insertMany(notifications);

    return res.status(201).json({ message: "Success", kpi: newKpi });
  } catch (error) {
    console.error("Error creating KPI:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const notifyUsers = async (req, res) => {
  try {
    const { kpiId, userIds } = req.body;

    if (!kpiId || !userIds?.length) {
      return res.status(400).json({ message: "Missing kpiId or userIds" });
    }

    const kpi = await KPI.findById(kpiId);
    if (!kpi) return res.status(404).json({ message: "KPI not found" });

    const notifications = userIds.map((userId) => ({
      user: userId,
      message: `คุณได้รับมอบหมาย KPI ใหม่: ${kpi.title}`,
      type: "in-app",
    }));

    await Notification.insertMany(notifications);

    res.json({ message: "Notification created successfully" });
  } catch (err) {
    console.error("notifyUsers error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getKpis = async (req, res) => {
  try {
    let query = {};

    if (req.user.role !== "admin") {
      query = { assigned_users: req.user._id };
    }

    const kpis = await KPI.find(query)
      .populate("assigned_users", "username email")
      .populate("created_by", "username email");

    res.status(200).json(kpis);
  } catch (err) {
    console.error("❌ Error fetching KPIs:", err);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล KPI" });
  }
};

export const getKpiHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const history = await KPIUpdate.find({ kpi_id: id })
      .populate("updated_by", "username email")
      .sort({ createdAt: -1 });

    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateKpiValue = async (req, res) => {
  try {
    const { kpiId } = req.params;
    const { updated_value, comment } = req.body;

    const kpi = await KPI.findById(kpiId);
    if (!kpi) return res.status(404).json({ message: "KPI not found" });

    if (kpi.status_task === "Not Started") {
      kpi.status_task = "In Progress";
    }

    const update = await KPIUpdate.create({
      kpi_id: kpi._id,
      updated_value,
      comment,
      updated_by: req.user._id,
    });

    kpi.actual_value = updated_value;

    if (updated_value >= kpi.target_value) {
      kpi.status_kpi = "On Track";
    } else if (updated_value >= kpi.target_value * 0.7) {
      kpi.status_kpi = "At Risk";
    } else {
      kpi.status_kpi = "Off Track";
    }

    await kpi.save();

    res.json({ kpi, update });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateKpi = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      target_value,
      unit,
      start_date,
      end_date,
      assignedUsers,
      updated_value,
      comment,
    } = req.body;

    const kpi = await KPI.findById(id);
    if (!kpi) return res.status(404).json({ message: "KPI not found" });

    let changes = {};

    // ตรวจสอบและบันทึกการเปลี่ยนแปลง
    if (title && title !== kpi.title) changes.title = [kpi.title, title];
    if (description && description !== kpi.description)
      changes.description = [kpi.description, description];
    if (target_value !== undefined && target_value !== kpi.target_value)
      changes.target_value = [kpi.target_value, target_value];
    if (unit && unit !== kpi.unit) changes.unit = [kpi.unit, unit];
    if (start_date && start_date !== kpi.start_date.toISOString().slice(0, 10))
      changes.start_date = [kpi.start_date, start_date];
    if (end_date && end_date !== kpi.end_date.toISOString().slice(0, 10))
      changes.end_date = [kpi.end_date, end_date];
    if (
      assignedUsers &&
      JSON.stringify(assignedUsers) !== JSON.stringify(kpi.assigned_users)
    )
      changes.assigned_users = [kpi.assigned_users, assignedUsers];

    if (updated_value !== undefined && updated_value !== kpi.actual_value)
      changes.actual_value = [kpi.actual_value, updated_value];

    // อัปเดต KPI
    if (title) kpi.title = title;
    if (description) kpi.description = description;
    if (target_value !== undefined) kpi.target_value = target_value;
    if (unit) kpi.unit = unit;
    if (start_date) kpi.start_date = start_date;
    if (end_date) kpi.end_date = end_date;
    if (assignedUsers) kpi.assigned_users = assignedUsers;
    if (updated_value !== undefined) kpi.actual_value = updated_value;

    await kpi.save();

    // บันทึก history ถ้ามีการเปลี่ยนแปลง
    if (Object.keys(changes).length > 0) {
      await KPIUpdate.create({
        kpi_id: kpi._id,
        updated_by: req.user._id,
        action:
          updated_value !== undefined
            ? "Updated Actual Value"
            : "Updated KPI Details",
        changes,
        comment: req.body.comment,
      });
    }

    res.status(200).json({ message: "KPI updated successfully", kpi });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteKpi = async (req, res) => {
  try {
    const { id } = req.params;

    const kpi = await KPI.findById(id);
    if (!kpi) {
      return res.status(404).json({ message: "have no KPI" });
    }

    await KPI.findByIdAndDelete(id);
    return res.status(200).json({ message: "Delete Success" });
  } catch (err) {
    console.error("❌ Error deleting KPI:", err);
    return res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบ KPI" });
  }
};

export const getAllUsers = async (req, res) => {
  console.log("req.user:", req.user);
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newUser = await User.create({
      username,
      email,
      password,
      role,
    });

    const { password: pwd, ...userData } = newUser.toObject();
    res.status(201).json({ message: "User created", user: userData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

export const updateUser = async (req, res) => {
  const { username, email, role } = req.body;
  const { id } = req.params;

  if (!username || !email || !role) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  //  ตรวจสอบ email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  // ตรวจสอบ username format (อนุญาตตัวอักษรอังกฤษ ตัวเลข ภาษาไทย และช่องว่าง)
  const usernameRegex = /^[a-zA-Z0-9ก-๙\s]+$/;
  if (!usernameRegex.test(username)) {
    return res.status(400).json({ message: "Invalid username format" });
  }

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // ตรวจ username ซ้ำ (ยกเว้น user ปัจจุบัน)
    const existingUsername = await User.findOne({ username });
    if (existingUsername && existingUsername._id.toString() !== id) {
      return res.status(400).json({ message: "duplicate username" });
    }

    //ตรวจ email ซ้ำ (ยกเว้น user ปัจจุบัน)
    const existingEmail = await User.findOne({ email });
    if (existingEmail && existingEmail._id.toString() !== id) {
      return res.status(400).json({ message: "duplicate email" });
    }

    // อัปเดตข้อมูล
    user.username = username;
    user.email = email;
    user.role = role;

    await user.save();

    res.json({ message: "User updated successfully", user });
  } catch (err) {
    console.error("❌ Error updating user:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const userToDelete = await User.findById(id);
    if (!userToDelete) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.findByIdAndDelete(id);
    return res.status(200).json({ message: "Delete Success" });
  } catch (err) {
    console.error("❌ Error deleting user:", err);
    return res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบ user" });
  }
};

export const getKpisCreatedByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const kpis = await KPI.find({ created_by: userId })
      .populate("assigned_users", "username email")
      .populate("created_by", "username email");
    res.json(kpis);
  } catch (error) {
    console.error("Error fetching KPIs created by user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getKpisAssignedToUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const kpis = await KPI.find({ assigned_users: userId })
      .populate("assigned_users", "username email")
      .populate("created_by", "username email");
    res.json(kpis);
  } catch (error) {
    console.error("Error fetching KPIs assigned to user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ฟังก์ชันดึงข้อมูล Dashboard
export const getAdminDashboard = async (req, res) => {
  const { period } = req.query;

  try {
    //  กำหนดช่วงเวลา
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

    //  ดึง KPI ตามช่วงเวลา
    const kpis = await KPI.find({ start_date: { $gte: startDate } }).populate(
      "assigned_users created_by"
    );

    //  สรุป KPI Status และ Task Status
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

    //  ส่งผลลัพธ์
    res.json({ kpiSummary, taskSummary, kpis });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
