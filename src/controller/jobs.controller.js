import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { Job } from "../model/job.model.js"


const createJob = asyncHandler(async (req, res) => {
    const {
        title,
        jobType,
        location,
        companyName,
        introduction,
        responsibilities,
        qualifications,
        offers,
        salary,
        hiringMultipleCandidates,
        personalWebsiteTitle,
        personalWebsiteUrl,
        jobNiche
    } = req.body;

    if (!title || !jobType || !location || !companyName || !introduction || !responsibilities || !salary || !jobNiche) {
        throw new ApiError(400, "Pleace provide your full job details..");
    }

    if ((personalWebsiteTitle && !personalWebsiteUrl) ||
        (!personalWebsiteTitle && personalWebsiteUrl)) {
        throw new ApiError(400, "Provide both the website url and title, or leave both blank")
    }
    const postedBy = req.user._id;
    const job = await Job.create({
        title,
        jobType,
        location,
        companyName,
        introduction,
        responsibilities,
        qualifications,
        offers,
        salary,
        hiringMultipleCandidates,
        personalWebsite: {
            title: personalWebsiteTitle,
            url: personalWebsiteUrl,
        },
        jobNiche,
        postedBy,
    })

    return res.status(200).json(new ApiResponse(200, job, "Job posted successfully."))
})

const updateJob = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const job = await Job.findById(id);

    if (!job) {
        throw new ApiError(404, "Job not found");
    }

    if (String(job.postedBy) !== String(userId)) {
        throw new ApiError(403, "You are not authorized to update this job");
    }

    const {
        title,
        jobType,
        location,
        companyName,
        introduction,
        responsibilities,
        qualifications,
        offers,
        salary,
        hiringMultipleCandidates,
        personalWebsiteTitle,
        personalWebsiteUrl,
        jobNiche
    } = req.body;

    if ((personalWebsiteTitle && !personalWebsiteUrl) ||
        (!personalWebsiteTitle && personalWebsiteUrl)) {
        throw new ApiError(400, "Provide both the website url and title, or leave both blank");
    }

    job.title = title || job.title;
    job.jobType = jobType || job.jobType;
    job.location = location || job.location;
    job.companyName = companyName || job.companyName;
    job.introduction = introduction || job.introduction;
    job.responsibilities = responsibilities || job.responsibilities;
    job.qualifications = qualifications || job.qualifications;
    job.offers = offers || job.offers;
    job.salary = salary || job.salary;
    job.hiringMultipleCandidates = hiringMultipleCandidates !== undefined ? hiringMultipleCandidates : job.hiringMultipleCandidates;
    job.personalWebsite = {
        title: personalWebsiteTitle || job.personalWebsite.title,
        url: personalWebsiteUrl || job.personalWebsite.url
    };
    job.jobNiche = jobNiche || job.jobNiche;

    await job.save();

    return res.status(200).json(new ApiResponse(200, job, "Job updated successfully"));
});


const getAllJobs = asyncHandler(async (req, res) => {
    const { city, niche, searchKeyword } = req.query;

    const query = {};

    if (city) query.location = city;

    if (niche) query.jobNiche = niche;

    if (searchKeyword) {
        query.$or = [
            { title: { $regex: searchKeyword, $options: "i" } },
            { companyName: { $regex: searchKeyword, $options: "i" } },
            { introduction: { $regex: searchKeyword, $options: "i" } },
        ];
    }
    const jobs = await Job.find(query).sort({ jobPostedOn: -1 });
    const jobCount = jobs.length;
    return res.status(200).json(new ApiResponse(200, {jobs, count: jobCount}, "Jobs fetched successfully."));
})

export { createJob, updateJob, getAllJobs }