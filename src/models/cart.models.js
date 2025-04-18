import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
      },
      quantity: {
        type: Number,
        required: true,
      },
      size: {
        type: String,
        default: null
      },
      color: {
        type: String,
        default: null
      }
    },
    { timestamps: true }
  );
  

export const Cart = mongoose.model("Cart",cartSchema)