import User from "../models/user.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();

const maxAge = 3 * 24 * 60 * 60;
const JWT_SECRET = process.env.JWT_SECRET;

const createToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: maxAge });
};

const handleErrors = (err) => {
  let errors = { email: "", password: "", role: "" };

  if (err.message === "incorrect email")
    errors.email = "That user is incorrect";
  if (err.message === "incorrect password")
    errors.password = "That user is incorrect";
  if (err.message === "incorrect role") errors.role = "That user is incorrect";

  if (err.code === 11000) {
    errors.email = "This user is already registered";
    return errors;
  }
  if (err.message.includes("Users validation failed")) {
    Object.values(err.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message;
    });
  }

  return errors;
};

// 🔑 ฟังก์ชันช่วยเลือกค่า cookie options (dev / production)
const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    maxAge: maxAge * 1000,
    sameSite: isProduction ? "None" : "Lax",
    secure: isProduction, // production = true, dev = false
  };
};

export const register = async (req, res) => {
  try {
    const { username, email, password, role, timestamps } = req.body;
    const user = await User.create({
      username,
      email,
      password,
      role,
      timestamps,
    });
    const token = createToken(user._id);

    res.cookie("jwt", token, getCookieOptions());

    res.status(201).json({ user: user._id, created: true });
  } catch (err) {
    const errors = handleErrors(err);
    res.json({ errors, created: false });
  }
};

export const login = async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    console.log("Login failed: Missing information");
    return res.status(400).json({
      errors: "Please input your information",
      status: false,
    });
  }

  try {
    const user = await User.login(email, password);

    // ตรวจสอบ role
    if (user.role !== role) {
      console.log(`Login failed: ${email} tried to login with wrong role`);
      throw Error("incorrect role");
    }

    const token = createToken(user._id);
    res.cookie("jwt", token, getCookieOptions());

    console.log(`Login successful: ${email}, role: ${role}`);
    res.status(200).json({ user: user._id, status: true });
  } catch (err) {
    const errors = handleErrors(err);
    res.json({ errors, status: false });
  }
};

// อัปเดตข้อมูลผู้ใช้
export const updateProfile = async (req, res) => {
  const { username, email, role } = req.body;
  const { id } = req.params;

  // 📌 ตรวจสอบข้อมูลเบื้องต้น
  if (!username || !email || !role) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // 📌 ตรวจสอบรูปแบบ email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  // 📌 ตรวจสอบ username ห้ามมีอักขระพิเศษ
  const usernameRegex = /^[a-zA-Z0-9ก-๙\s]+$/;
  if (!usernameRegex.test(username)) {
    return res.status(400).json({ message: "Invalid username format" });
  }

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 📌 ตรวจสอบว่า email ซ้ำกับของคนอื่นไหม
    const existingEmail = await User.findOne({ email });
    if (existingEmail && existingEmail._id.toString() !== id) {
      return res.status(400).json({ message: "Email is already in use" });
    }

    // 📌 ตรวจสอบว่า username ซ้ำกับของคนอื่นไหม
    const existingUsername = await User.findOne({ username });
    if (existingUsername && existingUsername._id.toString() !== id) {
      return res.status(400).json({ message: "Username is already in use" });
    }

    // ✅ อัปเดตข้อมูล
    user.username = username;
    user.email = email;
    user.role = role;

    await user.save();
    res.json({ message: "Profile updated successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// เปลี่ยนรหัสผ่าน
export const changePassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New passwords do not match" });
    }

    user.password = newPassword; // ❌ ไม่ต้อง hash
    await user.save(); // ✅ pre-save hook จะ hash ให้

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🗑 ลบบัญชีผู้ใช้
export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const user = req.user; // ✅ มาจาก requireUser middleware

    if (!password) {
      return res.status(400).json({ message: "Please provide your password" });
    }

    // ตรวจสอบรหัสผ่าน
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    // ลบผู้ใช้
    await User.findByIdAndDelete(user._id);

    // เคลียร์ cookie JWT หลังลบ
    res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });

    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
