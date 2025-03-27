import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.models.js";

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
  const createdUser = await User.findById(newUser._id).select("-password");
  if (!createdUser) {
    throw new ApiError(
      500,
      "Something went wrong while registering the user"
    );
  }
  return res
    .status(201)
    .json(
      new ApiResponse(201, createdUser, "User Registered Successfully")
    );
});

const userLogin = asyncHandler(async(req,res)=>{
    const {email,password} = req.body
    if(!email && !password){
        throw new ApiError(404,"Email and Password Both are required!")
    }
    const user = await User.findOne({email}).select("+password")
    if(!user){
        throw new ApiError(404,"User not found with this email")
    }
    const isPasswordMatched = await user.isPasswordCorrect(password)
    if(!isPasswordMatched){
        throw new ApiError(401,"Incorrect Password")
    }
    return res.status(200).json(
        new ApiResponse(200,user,"User Logged In Successfully")
    )

})

export{userRegister,userLogin}