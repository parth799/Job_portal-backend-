import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js"
import jwt from "jsonwebtoken"
import { User } from "../model/user.model.js"

export const isAuthenticated = asyncHandler(async (req, res, next) => {
    const { token } = req.cookies || req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
        throw new ApiError(400, "User is not authenticated.");
    }
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = req.user = await User.findById(decoded.id).select("-password");
    if(!user){
        throw new ApiError(401, "Invalid access Token")
    }
    next();
});

export const isAuthorized = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            new ApiError(400, `${req.user.role} not allowed to access this resource.`)
        }
        next();
    };
};