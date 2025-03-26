import mongoose from "mongoose";
import { generateUserName } from "../utils/userNameGenerator.js";
import bcrypt from "bcrypt";
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    profilePicture:{
      type:String,
      default:"https://res.cloudinary.com/dfndsnvda/image/upload/v1743002788/profile_default_eapyvf.jpg"
    },
    role: {
      type: String,
      enum: ["User", "Admin", "SuperAdmin"],
      default: "User",
    },
    address: [
      {
        street: String,
        city: String,
        state: String,
        pincode: {
          type: Number,
          required: true,
          min: 100000,
          max: 999999,
        },
        country: {
          type: String,
          required: true,
        },
      },
    ],
    wishlist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  this.username = await generateUserName(this.name);

  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};
export const User = mongoose.model("User", userSchema);
