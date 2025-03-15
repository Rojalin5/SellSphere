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
    transactionID: {
      type: String,
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "COD", "Paid", "Payment Failed"],
      default: "Pending",
      required: true,
    },
  },
  { timestamps: true }
);

orderSchema.pre("save", async function (next) {
  this.totalAmount = this.quantity * this.price;
  next();
});
export const Order = mongoose.model("Order", orderSchema);
