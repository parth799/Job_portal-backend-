import express from 'express';
import { isAuthenticated, isAuthorized } from '../middlewares/auth.middlewares.js';
import { createJob, updateJob, getAllJobs, getMyJob, deleteJob, getASingleJob } from '../controller/jobs.controller.js';

const router = express.Router();

router.post("/create-job", isAuthenticated, isAuthorized("Employer"), createJob);
router.put("/update-job/:id", isAuthenticated, isAuthorized("Employer"), updateJob);
router.get("/get-all-jobs", getAllJobs)
router.get("/getmyjobs", isAuthenticated, isAuthorized("Employer"), getMyJob);
router.delete("/delete/:id", isAuthenticated, isAuthorized("Employer"), deleteJob);
router.get("/get/:id", getASingleJob)

export default router;
