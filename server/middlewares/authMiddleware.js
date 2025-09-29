import User from "../models/user.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

export const requireUser = async (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = user; // ใส่ req.user ให้ middleware ถัดไป
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};


export const checkAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "User not set" });
  if (req.user.role !== "admin") return res.status(403).json({ message: "Access denied. Admins only." });
  next();
};

export const checkUser = async (req, res) => {
  const token = req.cookies.jwt;
  if (!token) return res.json({ status: false });

  jwt.verify(token, JWT_SECRET, async (err, decodedToken) => {
    if (err) return res.json({ status: false });

    const user = await User.findById(decodedToken.id);
    if (!user) return res.json({ status: false });

    const { password, ...userData } = user._doc;
    return res.json({ status: true, user: userData });
  });
};
