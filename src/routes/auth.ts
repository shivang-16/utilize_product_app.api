import express from "express";
import {
  getUser,
  googleAuth,
  login,
  logout,
  otpVerification,
  register,
} from "../controllers/Auth";
import { checkAuth } from "../middlewares/checkAuth";


const router = express.Router();

router.post("/register", register);
router.post("/verify", otpVerification);
router.post("/login", login);
router.get("/logout", logout);
router.get("/user", checkAuth, getUser);
router.post("/google", googleAuth);

export default router;
