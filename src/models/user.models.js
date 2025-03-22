import mongoose from "mongoose";
import { generateUserName } from "../utils/userNameGenerator.js";
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
    role: {
      type: String,
      enum: ["User", "Admin","SuperAdmin"],
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
  next();
});
export const User = mongoose.model("User", userSchema);
