import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { User } from "../model/user.model.js";
import { v2 as cloudinary } from "cloudinary"
import { sendToken } from "../utils/jwtToken.js";

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

    res.status(200).cookie("token", token, options).json(new ApiResponse(200, {
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

    res.status(200).cookie("token", token, options).json(new ApiResponse(200, {
        user: user,
        token,
    }, "login successfully!",));
})

const logoutUser = asyncHandler(async (req, res) => {
    res
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
    res.json(new ApiResponse(200, {
        user,
    }, "User data"));
})



export { registerUser, userLogin, logoutUser, getCurrentUser }