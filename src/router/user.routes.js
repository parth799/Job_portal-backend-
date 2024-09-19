import express from 'express';
import { getCurrentUser, logoutUser, registerUser, userLogin } from '../controller/user.controller.js';
import {isAuthenticated} from "../middlewares/auth.middlewares.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", userLogin);
router.get("/logout", isAuthenticated, logoutUser);
router.get("/getuser", isAuthenticated, getCurrentUser);

export default router;