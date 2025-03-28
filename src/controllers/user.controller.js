import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
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
    expries: new Date(0)
  };
  return res.status(200).cookie("accessToken","",option).cookie("refreshToken","",option).
  json(
    new ApiResponse(200,{},"User Logged Out Successfully")
  )
});

export { userRegister, userLogin, userLogout };
