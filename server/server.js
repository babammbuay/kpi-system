import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cron from "node-cron";
import {
  generateUserNotifications,
  dailyKpiSummaryForAdmin,
} from "./controllers/notiController.js";

import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

import userRoutes from "./routes/userRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

// โหลดค่า .env
dotenv.config();

const app = express();

// ใช้ค่า .env
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI;

// เชื่อมต่อ MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("DB Connection Successful"))
  .catch((err) => console.log(err.message));

// Middleware
app.use(
  cors({
    origin: "https://kpi-system-frontend.onrender.com",
    credentials: true,
  })
);



app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/user", userRoutes);
app.use("/notificate", notificationRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server Started Successfully on PORT ${PORT}`);
});

// ทุกชั่วโมง → ตรวจ KPI user
cron.schedule("0 * * * *", async () => {
  await generateUserNotifications();
});

// ทุกวันตอน 8 โมง → สรุป KPI admin
cron.schedule("0 8 * * *", async () => {
  await dailyKpiSummaryForAdmin();
});
