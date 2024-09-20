import express from 'express';
import { isAuthenticated, isAuthorized } from "../middlewares/auth.middlewares.js"
import { employergetAllApplication, postApplication, jobSeekerGetAllApplication, deleteApplication } from '../controller/application.controller.js';

const router = express.Router();

router.post("/post/:id", isAuthenticated, isAuthorized("Job Seeker"), postApplication)
router.get("/employer/getall", isAuthenticated, isAuthorized("Employer"), employergetAllApplication);
router.get("/jobseeker/getall", isAuthenticated, isAuthorized("Job Seeker"), jobSeekerGetAllApplication);

router.delete("/delete/:id", isAuthenticated, deleteApplication);

export default router