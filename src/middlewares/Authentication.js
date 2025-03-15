import jwt from "jsonwebtoken";
import { ErrorHandler } from "../utils/ErrorHandler.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";

const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accesstoken ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      throw new ErrorHandler(404, "Unauthorized Request!!");
    }
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshtoken"
    );
    if (!user) {
      throw new ErrorHandler(404, "Invalid Access Token");
    }
    req.user = user;
    next();
  } catch (error) {
    throw new ErrorHandler(401, error?.message || "Invalid Message Token");
  }
});

export { verifyJWT };
