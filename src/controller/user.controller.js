import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { User } from "../model/user.model.js";
import { v2 as cloudinary } from "cloudinary"

const registerUser = asyncHandler(async (req, res) => {
    const { name, email, phone, address, password, role, firstNiche, secondNiche, thirdNiche, coverLetter } = req.body;

    if (!name || !email || !phone || !address || !password || !role) {
        throw new ApiError(400, "All fileds are required");
    }
    if (role === "Job Seeker" && (!firstNiche || !secondNiche || !thirdNiche)) {
        throw new ApiError(400, "Please provide your preferred job niches.");
    }
    const existingUser = await User.findOne({ email })
    if (existingUser) {
        throw new ApiError(400, "Email already exists");
    }

    const userData = {
        name,
        email,
        phone,
        address,
        password,
        role,
        niches: {
            firstNiche,
            secondNiche,
            thirdNiche,
        },
        coverLetter
    };

    if (req.files && req.files.resume) {
        const { resume } = req.files;

        if (resume) {
            try {
                const uploadOnCloudinary = await cloudinary.uploader.upload(resume.tempFilePath, { folder: "Job_Resume" })
                if (!uploadOnCloudinary || uploadOnCloudinary.erorr) {
                    throw new ApiError(500, "Failed to upload to Cloudinary")
                }
                userData.resume = {
                    public_id: uploadOnCloudinary.public_id,
                    url: uploadOnCloudinary.secure_url,
                }
            } catch (error) {
                throw new ApiError(500, "upload on cloudinary failed")
            }
        }
    }
    const user = await User.create(userData);

    const token = user.getJWTToken();

    const options = {
        expires: new Date(
            Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
    };

    return res.status(200).cookie("token", token, options).json(new ApiResponse(200, {
        user: user,
        token,
    }, "register successfully!",));
})

const userLogin = asyncHandler(async (req, res) => {
    const { role, email, password } = req.body;

    if (!role || !email || !password) {
        throw new ApiError(400, "All fields are required");
    }
    const user = await User.findOne({ email }).select("+password")
    if (!user) {
        throw new ApiError(401, "Invalid email or password");
    }
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
        throw new ApiError(401, "Invalid email or password");
    }
    if (user.role !== role) {
        throw new ApiError(401, "Unauthorized access");
    }
    const token = user.getJWTToken();

    const options = {
        expires: new Date(
            Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
    };

    return res.status(200).cookie("token", token, options).json(new ApiResponse(200, {
        user: user,
        token,
    }, "login successfully!",));
})

const logoutUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .cookie("token", "", {
            expires: new Date(Date.now()),
            httpOnly: true,
        })
        .json(new ApiResponse(200, {
            success: true,
            message: "Logged out successfully.",
        }));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select("-password")
    return res.json(new ApiResponse(200, {
        user,
    }, "User data"));
})

const updateProfile = asyncHandler(async (req, res) => {
    const newUserData = {
        name: req.body.name || req?.user?.name,
        email: req.body.email || req?.user?.email,
        phone: req.body.phone || req?.user?.phone,
        address: req.body.address || req?.user?.address,
        coverLetter: req.body.coverLetter || req?.user?.coverLetter,
        niches: {
            firstNiche: req.body.firstNiche || req?.user?.niches?.firstNiche,
            secondNiche: req.body.secondNiche || req?.user?.niches?.secondNiche,
            thirdNiche: req.body.thirdNiche || req?.user?.niches?.thirdNiche,
        },
    };
    const { firstNiche, secondNiche, thirdNiche } = newUserData?.niches;
    if (req.user.role === "Job Seeker" && (!firstNiche || !secondNiche || !thirdNiche)) {
        throw new ApiError(400, "Please provide your preferred job niches.");
    }

    if (req.files && req.files.resume) {
        try {
            const resumeFile = req.files.resume;

            const currentResumeId = req.user?.resume?.public_id;
            if (currentResumeId) {
                await cloudinary.uploader.destroy(currentResumeId);
            }

            const uploadOnCloudinary = await cloudinary.uploader.upload(resumeFile.tempFilePath, { folder: "Job_Resume" });

            if (!uploadOnCloudinary || uploadOnCloudinary.error) {
                throw new ApiError(500, "Failed to upload resume to Cloudinary");
            }

            newUserData.resume = {
                public_id: uploadOnCloudinary.public_id,
                url: uploadOnCloudinary.secure_url,
            };

        } catch (error) {
            console.error("Error during resume upload:", error);
            throw new ApiError(500, `Failed to upload resume. Error: ${error.message}`);
        }
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    }).select("-password");

    return res.status(200).json(new ApiResponse(200, {
        user: updatedUser,
    }, "Profile updated successfully!"));
});



const changePassword = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select("+password");

    const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

    if (!isPasswordMatched) {
        throw new ErrorHandler("Old password is incorrect.", 400);
    }

    if (req.body.newPassword !== req.body.confirmPassword) {
        throw new ErrorHandler("New password & confirm password do not match.", 400)
    }

    user.password = req.body.newPassword;
    await user.save();
    const token = user.getJWTToken();

    const options = {
        expires: new Date(
            Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
    };

    return res.status(200).cookie("token", token, options).json(new ApiResponse(200, {
        user: user,
        token,
    }, "password updates successfully!",));
})

export { registerUser, userLogin, logoutUser, getCurrentUser, updateProfile, changePassword }