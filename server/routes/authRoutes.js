import express from "express";
import {
  register,
  login,
  updateProfile,
  changePassword,
  deleteAccount,
} from "../controllers/authControllers.js";
import { checkUser, requireUser, } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", checkUser); 
router.post("/register", register);
router.post("/login", login);

router.put("/profile/:id", requireUser, updateProfile);
router.put("/change-password", requireUser, changePassword);
router.delete("/delete-account", requireUser, deleteAccount);

export default router;
