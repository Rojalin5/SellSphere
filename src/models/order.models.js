import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min:1
    },
    price: {
      type: Number,
      required: true,
      min:0
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["Confirmed", "Pending", "Delivered", "Shipped", "Cancelled"],
      default: "Pending",
      required: true,
    },
    isDeleted:{
      type:Boolean,
      default:false
    },  paymentResult: {
      id: { type: String }, // Transaction ID from Stripe
      status: { type: String }
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
    }
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);
