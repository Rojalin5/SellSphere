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
  const { name, email, password, role, address } = req.body;
  if (!name && !email && !password && !role && !address) {
    throw new ApiError(400, "Atleast one field is required to update");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        name,
        email,
        password,
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
  const userID = req.user._id;
  const user = await User.findById(userID);
  if (!user) {
    throw new ApiError(404, "User not found with this ID");
  }
  const profilePictureLocalPath = req.file?.path;
  if (!profilePictureLocalPath) {
    throw new ApiError(400, "Profile Picture is missing");
  }
  if (
    user.profilePicture &&
    user.profilePicture !== process.env.DEFAULT_PROFILE_PICTURE
  ) {
    const publicID = extractpublicIDFromUrl(user.profilePicture);
    await deleteFileFromCloudinary(publicID);
  }
  let profilePicture = process.env.DEFAULT_PROFILE_PICTURE;
  if (req.file) {
    profilePicture = await uploadOnCloudinary(req.file.path);
    if (!profilePicture) {
      throw new ApiError(
        500,
        "Something went wrong while uploading Profile Picture"
      );
    }
  }
  user.profilePicture = profilePicture;
  await user.save();
  res
    .status(200)
    .json(new ApiResponse(200, user, "Profile Picture Updated Successfully"));
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
  userProfileDelete,
};
