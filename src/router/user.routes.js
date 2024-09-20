import express from 'express';
import { changePassword, getCurrentUser, logoutUser, registerUser, updateProfile, userLogin } from '../controller/user.controller.js';
import { isAuthenticated } from "../middlewares/auth.middlewares.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", userLogin);
router.get("/logout", isAuthenticated, logoutUser);
router.get("/getuser", isAuthenticated, getCurrentUser);
router.put("/update/profile", isAuthenticated, updateProfile);
router.put("/update/password", isAuthenticated, changePassword);

export default router;