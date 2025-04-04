import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  uploadOnCloudinary,
  extractpublicIDFromUrl,
  deleteFileFromCloudinary,
} from "../utils/cloudinary.js";
import { User } from "../models/user.models.js";
import { generateAccessAndRefreshToken } from "../utils/generateToken.js";
import jwt from "jsonwebtoken";

const userRegister = asyncHandler(async (req, res) => {
  const { name, email, password, role, address } = req.body;
  if (!name) {
    throw new ApiError(400, "Name is Required!");
  }
  if (!email) {
    throw new ApiError(400, "Email is Required!");
  }
  if (!password) {
    throw new ApiError(400, "Password is Required!");
  }

  const ExistedUser = await User.findOne({ $or: [{ email }] });
  if (ExistedUser) {
    throw new ApiError(
      400,
      "User with this Email ID already exists.Please try another"
    );
  }

  let profilePictureLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.profilePicture) &&
    req.files.profilePicture.length > 0
  ) {
    profilePictureLocalPath = req.files.profilePicture[0].path;
  }
  const profilePicture = await uploadOnCloudinary(profilePictureLocalPath);

  const newUser = await User.create({
    name,
    email,
    password,
    profilePicture: profilePicture?.url,
    role,
    address,
  });
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    newUser._id
  );
  const createdUser = await User.findById(newUser._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }
  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { User: createdUser, accessToken, refreshToken },
        "User Registered Successfully"
      )
    );
});

const userLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(404, "Email and Password Both are required!");
  }
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw new ApiError(404, "User not found with this email");
  }
  const isPasswordMatched = await user.isPasswordCorrect(password);
  if (!isPasswordMatched) {
    throw new ApiError(401, "Incorrect Password");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );
  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
      new ApiResponse(
        200,
        { user: user, accessToken, refreshToken },
        "User Logged In Successfully"
      )
    );
});

const userLogout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    { new: true }
  );
  const option = {
    httpOnly: true,
    secure: true,
    expries: new Date(0),
  };
  return res
    .status(200)
    .cookie("accessToken", "", option)
    .cookie("refreshToken", "", option)
    .json(new ApiResponse(200, {}, "User Logged Out Successfully"));
});

const userDetailUpdate = asyncHandler(async (req, res) => {
  const userID = req.user._id;
  const { name, email, role, address } = req.body;
  if (!name && !email && !role && !address) {
    throw new ApiError(400, "Atleast one field is required to update");
  }
  const user = await User.findByIdAndUpdate(
    userID,
    {
      $set: {
        name,
        email,
        role,
        address,
      },
    },
    { new: true }
  ).select("-password");
  if (!user) {
    throw new ApiError(404, "User not found with this ID");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, user, "User Details Updated Successfully"));
});

const userProfilePictureUpdate = asyncHandler(async (req, res) => {
  const profilePictureLocalPath = req.file?.path;
  if (!profilePictureLocalPath) {
    throw new ApiError(
      400,
      "Profile Picture is required for updating profile."
    );
  }
  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(404, "User not found.");
  }
  if (
    user.profilePicture &&
    user.profilePicture !== process.env.DEFAULT_PROFILE_PICTURE
  ) {
    const publicID = extractpublicIDFromUrl(user.profilePicture);
    if (publicID) {
      await deleteFileFromCloudinary(publicID);
    }
  }
  const profilePicture = await uploadOnCloudinary(profilePictureLocalPath);
  if (!profilePicture.url) {
    throw new ApiError(400, "Error while uploading profile picture!");
  }
  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        profilePicture: profilePicture.url,
      },
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedUser, "Profile Picture Updated Successfully")
    );
});
const userProfilePictureDelete = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(404, "User Not Found!");
  }
  if (
    user.profilePicture &&
    user.profilePicture !== process.env.DEFAULT_PROFILE_PICTURE
  ) {
    const publicID = extractpublicIDFromUrl(user.profilePicture);
    console.log("Public ID:", publicID);
    if (publicID) {
      await deleteFileFromCloudinary(publicID);
    }
  }
  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        profilePicture: process.env.DEFAULT_PROFILE_PICTURE,
      },
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedUser, "Profile Picture Deleted Successfully")
    );
});
const currentUserDetail = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User detail Fetched Successfully"));
});
const userPasswordChange = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("+password");
  if (!user) {
    throw new ApiError(404, "User not found with this ID");
  }
  const { oldPassword, newPassword, confirmPassword } = req.body;
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid Current Password");
  }
  if (!oldPassword || !newPassword || !confirmPassword) {
    throw new ApiError(400, "All fields are Required!");
  }
  if (oldPassword == newPassword) {
    throw new ApiError(
      400,
      "New Password Should be diffenrent from Your previous Password!"
    );
  }
  if (newPassword !== confirmPassword) {
    throw new ApiError(400, "New Password and Confirm Password Must be same!");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changes Successfully!"));
});
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request!");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is expired or used!");
    }
    const option = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );
    return res
      .status(200)
      .cookie("accessToken", accessToken, option)
      .cookie("refreshToken", refreshToken, option)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access Token Generated Successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error.message || "Invalid Refresh Token");
  }
});
const userProfileDelete = asyncHandler(async (req, res) => {
  const userID = req.user._id;
  const user = await User.findByIdAndDelete(userID);
  if (!user) {
    throw new ApiError(404, "User not found with this ID");
  }
  return res
    .status(200)
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json(new ApiResponse(200, {}, "User Deleted Successfully"));
});
export {
  userRegister,
  userLogin,
  userLogout,
  userDetailUpdate,
  userProfilePictureUpdate,
  userProfilePictureDelete,
  currentUserDetail,
  userPasswordChange,
  refreshAccessToken,
  userProfileDelete,
};