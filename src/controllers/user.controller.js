import { asyncHandler } from "../utils/asyncHandler.js";
import { ErrorHandler } from "../utils/ErrorHandler.js";
import { ResponseHandler } from "../utils/ResponseHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.models.js";

const userRegister = asyncHandler(async (req, res) => {
  const { name, email, password, role, address } = req.body;
  if (!name) {
    throw new ErrorHandler(400, "Name is Required!");
  }
  if (!email) {
    throw new ErrorHandler(400, "Email is Required!");
  }
  if (!password) {
    throw new ErrorHandler(400, "Password is Required!");
  }

  const ExistedUser = await User.findOne({ $or: [{ email }] });
  if (ExistedUser) {
    throw new ErrorHandler(
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
    profilePicture: profilePicture?.url || "",
    role,
    address,
  });
  const createdUser = await User.findById(newUser._id).select("-password");
  if (!createdUser) {
    throw new ErrorHandler(
      500,
      "Something went wrong while registering the user"
    );
  }
  return res
    .status(201)
    .json(
      new ResponseHandler(201, createdUser, "User Registered Successfully")
    );
});


export{userRegister}