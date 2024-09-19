import express from 'express';
import { isAuthenticated, isAuthorized } from '../middlewares/auth.middlewares.js';
import { createJob, updateJob } from '../controller/jobs.controller.js';

const router = express.Router();

router.post("/create-job", isAuthenticated, isAuthorized("Employer"), createJob);
router.put("/update-job/:id", isAuthenticated, isAuthorized("Employer"), updateJob);

export default router;
