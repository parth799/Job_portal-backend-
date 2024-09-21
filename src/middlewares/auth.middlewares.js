import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../model/user.model.js";

export const isAuthenticated = asyncHandler(async (req, res, next) => {
  try {
    const token = req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "User is not authenticated. Access denied.");
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decoded?.id).select("-password");
    
    if (!user) {
      throw new ApiError(401, "Invalid access token. User not found.");
    }

    req.user = user;
    next();
  } catch (error) {
    throw error;
  }
});

export const isAuthorized = (...roles) => {
  return (req, res, next) => {
    try {
      if (!roles.includes(req.user.role)) {
        throw new ApiError(403, `${req.user.role} is not allowed to access this resource.`);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
