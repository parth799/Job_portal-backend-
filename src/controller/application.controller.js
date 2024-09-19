import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { Application } from "../model/application.model.js";
import { Job } from "../model/job.model.js";
import { v2 as cloudinary } from "cloudinary"

const postApplication = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, coverLetter, address } = req.body;

    if (!name || !email || !phone || !address || !coverLetter) {
        throw new ApiError(400, "all filde are required !")
    }

    const jobSeekerInfo = {
        id: req.user._id,
        name,
        email,
        phone,
        address,
        coverLetter,
        role: "Job Seeker",
    };

    const jobDetails = await Job.findById(id);

    if (!jobDetails) {
        throw new ApiError(404, "Job not found");
    }

    const existingApplication = await Application.findOne({ "jobInfo.jobId": id, "jobSeekerInfo.id": req.user._id });

    if (existingApplication) {
        throw new ApiError(400, "You have already applied for this job");
    }

    if (req.files && req.files.resume) {
        const { resume } = req.files.resume;
        try {
            const cloudinaryResponse = await cloudinary.uploader.upload(
                resume.tempFilePath,
                {
                    folder: "Job_Resume",
                }
            );
            if (!cloudinaryResponse || cloudinaryResponse.error) {
                throw new ApiError(500, "Failed to upload resume to cloudinary.")
            }
            jobSeekerInfo.resume = {
                public_id: cloudinaryResponse.public_id,
                url: cloudinaryResponse.secure_url,
            };
        } catch (error) {
            throw new ApiError(500, "Failed to upload resume");
        }
    }
    else {
        if (req.user && !req.user.resume.url) {
            throw new ApiError(400, "Please upload your resume.");
        }
        jobSeekerInfo.resume = {
            public_id: req.user && req.user.resume.public_id,
            url: req.user && req.user.resume.url,
        };
    }

    const employerInfo = {
        id: jobDetails.postedBy,
        role: "Employer",
    };

    const jobInfo = {
        jobId: id,
        jobTitle: jobDetails.title,
    };

    const application = await Application.create({
        jobSeekerInfo,
        employerInfo,
        jobInfo,
    });

    return res.status(201).json(new ApiResponse(201, application, "Application submitted successfully."));
})


const employergetAllApplication = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const applications = await Application.find({ "employerInfo.id": _id, "deletedBy.employer": false, });

    return res.status(200).json(new ApiResponse(200, applications, "Applications fetched successfully."));
})

const jobSeekerGetAllApplication = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const applications = await Application.find({ "jobSeekerInfo.id": _id, "deletedBy.jobSeeker": false, });

    return res.status(200).json(new ApiResponse(200, applications, "Applications fetched successfully."));
})

const deleteApplication = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const application = await Application.findById(id);

    if (!application) {
        throw new ApiError(404, "Application not found");
    }
    if (String(application.employerInfo.id) !== String(req.user._id) && String(application.jobSeekerInfo.id) !== String(req.user._id)) {
        throw new ApiError(403, "You are not authorized to delete this application.");
    }

    const { role } = req.user;
    switch (role) {
        case "Job Seeker":
            application.deletedBy.jobSeeker = true;
            await application.save();
            break;
        case "Employer":
            application.deletedBy.employer = true;
            await application.save();
            break;
        default:
            console.log("Default case for application delete function.");
            break;
    }

    if (application.deletedBy.employer === true && application.deletedBy.jobSeeker === true) {
        await application.deleteOne();
    }

    return res.status(200).json(new ApiResponse(200, null, "Application deleted successfully."));
})

export { postApplication, employergetAllApplication, jobSeekerGetAllApplication, deleteApplication }